import type { XYPosition } from "@xyflow/react";
import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";

import type { ComponentSpec } from "@/models/componentSpec";
import { IncrementingIdGenerator } from "@/models/componentSpec/factories/idGenerator";
import { editorRegistry } from "@/routes/v2/pages/Editor/nodes";
import {
  type ClipboardReadResult,
  readEnvelopeFromSystemClipboard,
  writeToSystemClipboard,
} from "@/routes/v2/shared/clipboard/clipboardEnvelope";
import { computeSnapshotBounds } from "@/routes/v2/shared/clipboard/copyNodesToClipboard";
import { snapshotInternalBindings } from "@/routes/v2/shared/clipboard/snapshotBindings";
import type {
  BindingSnapshot,
  NodeSnapshot,
  UndoGroupable,
} from "@/routes/v2/shared/nodes/types";
import type { SelectedNode } from "@/routes/v2/shared/store/editorStore";

import { cloneSnapshotsWithBindings } from "./clipboardStore.helpers";

const PASTE_OFFSET = 50;

const idGen = new IncrementingIdGenerator();

export type PasteOutcome =
  | { status: "pasted"; nodeIds: string[] }
  | { status: "nothing-to-paste" }
  | { status: "clipboard-unavailable" };

export class ClipboardStore {
  @observable.shallow accessor snapshots: NodeSnapshot[] = [];
  @observable.shallow accessor bindingSnapshots: BindingSnapshot[] = [];
  @observable accessor pasteOffsetIndex: number = 0;

  constructor(private undoStore: UndoGroupable) {
    makeObservable(this);
  }

  @computed get hasContent(): boolean {
    return this.snapshots.length > 0;
  }

  /** Rejects when the system clipboard write fails; the in-memory copy stands. */
  async copy(
    spec: ComponentSpec,
    selectedNodes: SelectedNode[],
  ): Promise<void> {
    const { snapshots, bindings } = this.collect(spec, selectedNodes);
    this.stage(snapshots, bindings);
    await writeToSystemClipboard(snapshots, bindings);
  }

  /**
   * `pasteEventRead` comes from a native `paste` event and is authoritative:
   * when it is present the async clipboard read is skipped, avoiding the
   * clipboard-read permission prompt entirely.
   */
  async paste(
    spec: ComponentSpec,
    centerPosition: XYPosition,
    pasteEventRead?: ClipboardReadResult,
  ): Promise<PasteOutcome> {
    const read =
      !pasteEventRead || pasteEventRead.kind === "unavailable"
        ? await readEnvelopeFromSystemClipboard()
        : pasteEventRead;

    const envelope = read.kind === "envelope" ? read.envelope : null;
    const snapshots = envelope?.snapshots ?? this.snapshots;
    const bindings = envelope?.bindings ?? this.bindingSnapshots;

    if (snapshots.length === 0) {
      return read.kind === "unavailable"
        ? { status: "clipboard-unavailable" }
        : { status: "nothing-to-paste" };
    }

    const offset = this.pasteOffsetIndex * PASTE_OFFSET;
    const nodeIds = this.cloneSnapshotsAtPosition(spec, snapshots, bindings, {
      x: centerPosition.x + offset,
      y: centerPosition.y + offset,
    });

    runInAction(() => {
      this.pasteOffsetIndex += 1;
    });

    return { status: "pasted", nodeIds };
  }

  duplicate(spec: ComponentSpec, selectedNodes: SelectedNode[]): string[] {
    const { snapshots, bindings } = this.collect(spec, selectedNodes);

    if (snapshots.length === 0) return [];

    return cloneSnapshotsWithBindings(
      spec,
      snapshots,
      bindings,
      (s) => ({
        x: s.position.x + PASTE_OFFSET,
        y: s.position.y + PASTE_OFFSET,
      }),
      this.undoStore,
      idGen,
      "Duplicate nodes",
    );
  }

  @action clear() {
    this.snapshots = [];
    this.bindingSnapshots = [];
    this.pasteOffsetIndex = 0;
  }

  private collect(
    spec: ComponentSpec,
    selectedNodes: SelectedNode[],
  ): { snapshots: NodeSnapshot[]; bindings: BindingSnapshot[] } {
    const snapshots: NodeSnapshot[] = [];
    for (const node of selectedNodes) {
      const manifest = editorRegistry.get(node.type);
      const snapshot =
        manifest?.snapshotHandler?.snapshot(spec, node.id) ??
        manifest?.cloneHandler?.snapshot(spec, node.id);
      if (snapshot) snapshots.push(snapshot);
    }

    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    return { snapshots, bindings: snapshotInternalBindings(spec, selectedIds) };
  }

  @action private stage(
    snapshots: NodeSnapshot[],
    bindings: BindingSnapshot[],
  ) {
    this.snapshots = snapshots;
    this.bindingSnapshots = bindings;
    this.pasteOffsetIndex = 0;
  }

  private cloneSnapshotsAtPosition(
    spec: ComponentSpec,
    snapshots: NodeSnapshot[],
    bindings: BindingSnapshot[],
    centerPosition: XYPosition,
  ): string[] {
    const bounds = computeSnapshotBounds(snapshots);
    const snapshotCenter = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };

    return cloneSnapshotsWithBindings(
      spec,
      snapshots,
      bindings,
      (s) => ({
        x: centerPosition.x + (s.position.x - snapshotCenter.x),
        y: centerPosition.y + (s.position.y - snapshotCenter.y),
      }),
      this.undoStore,
      idGen,
      "Paste nodes",
    );
  }
}
