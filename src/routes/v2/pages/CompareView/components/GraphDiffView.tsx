import "@xyflow/react/dist/style.css";

import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  useViewport,
} from "@xyflow/react";
import equal from "fast-deep-equal";
import { useEffect, useState } from "react";

import { InfoBox } from "@/components/shared/InfoBox";
import { autoLayoutNodes } from "@/components/shared/ReactFlow/FlowCanvas/utils/autolayout";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/providers/AnalyticsProvider";
import {
  buildMergedGraph,
  type MergedNode,
  type SpotlightMode,
} from "@/routes/v2/pages/CompareView/utils/buildMergedGraph";
import type { CompareMode } from "@/routes/v2/pages/CompareView/utils/compareMode";
import type {
  DiffStatus,
  PipelineComparison,
  TaskDiff,
} from "@/routes/v2/pages/CompareView/utils/comparePipelines";
import { RUN_TONE } from "@/routes/v2/pages/CompareView/utils/runTone";
import { FLOW_CANVAS_DEFAULT_PROPS } from "@/routes/v2/shared/flowCanvasDefaults";
import { tracking } from "@/utils/tracking";

import { diffStatusLabel } from "./DiffStatusBadge";
import { IoDiffDetail } from "./IoDiffDetail";
import { MergedIoNode } from "./MergedIoNode";
import { MergedTaskNode } from "./MergedTaskNode";
import { TaskDiffDetail } from "./TaskDiffDetail";

const taskDisplayName = (diff: TaskDiff) =>
  diff.a?.componentRef.spec?.name ??
  diff.b?.componentRef.spec?.name ??
  diff.taskId;

const NODE_TYPES = { mergedTask: MergedTaskNode, mergedIo: MergedIoNode };

const EDGE_STROKE: Record<DiffStatus, string> = {
  unchanged: "var(--diff-unchanged)",
  lost: "var(--diff-lost)",
  new: "var(--diff-new)",
  changed: "var(--diff-changed)",
};

const SWATCH: Record<DiffStatus, string> = {
  unchanged: "bg-diff-unchanged",
  lost: "bg-diff-lost",
  new: "bg-diff-new",
  changed: "bg-diff-changed",
};

const LEGEND_ORDER: DiffStatus[] = ["new", "lost", "changed", "unchanged"];

const nodeInRun = (status: DiffStatus, run: "a" | "b") =>
  run === "a" ? status !== "new" : status !== "lost";

const edgeInRun = (membership: DiffStatus, run: "a" | "b") =>
  run === "a" ? membership !== "new" : membership !== "lost";

interface GraphDiffViewProps {
  comparison: PipelineComparison;
  nameA: string;
  nameB: string;
  labelA: string;
  labelB: string;
  mode: CompareMode;
}

export function GraphDiffView(props: GraphDiffViewProps) {
  if (!props.comparison.hasComparableGraph) {
    return (
      <InfoBox title="No graph to compare" variant="info" width="full">
        {props.mode.kind === "empty"
          ? "Select two runs to compare their pipeline graphs."
          : "Neither run has a graph pipeline, so there are no tasks to lay out. Use the YAML tab to compare the raw specifications."}
      </InfoBox>
    );
  }

  return (
    <ReactFlowProvider>
      <MergedGraphCanvas {...props} />
    </ReactFlowProvider>
  );
}

function MergedGraphCanvas({
  comparison,
  nameA,
  nameB,
  labelA,
  labelB,
  mode,
}: GraphDiffViewProps) {
  const { track } = useAnalytics();
  const singleRun = mode.kind === "single";

  const { nodes: base, edges: baseEdges } = buildMergedGraph(comparison);
  const topology = base.map((node) => node.id).join("|");

  const [nodes, setNodes, onNodesChange] = useNodesState(base);
  const [spotlight, setSpotlight] = useState<SpotlightMode>("both");
  const [laidOut, setLaidOut] = useState(false);
  const [seededTopology, setSeededTopology] = useState(topology);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = selectedNodeId
    ? (base.find((node) => node.id === selectedNodeId) ?? null)
    : null;

  const initialized = useNodesInitialized();
  const { fitView } = useReactFlow();

  /**
   * The comparison is refetched every few seconds while either run is still
   * going, so the rebuilt model has to be pushed back into node state — seeding
   * `useNodesState` only covers first paint, and the graph would otherwise keep
   * showing the statuses it was born with. Diffs are swapped in place so
   * positions survive a status-only refresh; a changed node set reseeds and
   * re-runs layout instead.
   */
  useEffect(() => {
    if (topology !== seededTopology) {
      setNodes(base);
      setSeededTopology(topology);
      setLaidOut(false);
      return;
    }

    setNodes((current) => {
      const rebuilt = new Map(base.map((node) => [node.id, node.data.diff]));
      let changed = false;

      const next = current.map((node) => {
        const diff = rebuilt.get(node.id);
        if (!diff || equal(diff, node.data.diff)) return node;
        changed = true;
        return { ...node, data: { ...node.data, diff } } as MergedNode;
      });

      return changed ? next : current;
    });
  }, [base, topology, seededTopology, setNodes]);

  const sizeSignature = nodes
    .map(
      (node) => `${node.id}@${node.measured?.width}x${node.measured?.height}`,
    )
    .join("|");
  const [layoutSignature, setLayoutSignature] = useState("");

  /**
   * Node height is content-driven — spotlighting a run adds its side values, a
   * status arriving adds a status tab — so positions computed for the previous
   * heights leave nodes overlapping each other. Laying out again whenever a
   * measured size changes keeps them apart, and since positions never feed back
   * into sizes it settles in one pass.
   */
  useEffect(() => {
    if (!initialized || sizeSignature === layoutSignature) return;
    setNodes((current) => autoLayoutNodes(current, baseEdges) as MergedNode[]);
    setLayoutSignature(sizeSignature);
    setLaidOut(true);
  }, [initialized, sizeSignature, layoutSignature, baseEdges, setNodes]);

  useEffect(() => {
    if (laidOut) {
      fitView({ padding: 0.2, maxZoom: 1 });
    }
  }, [laidOut, fitView]);

  /**
   * Nodes outside the spotlighted run fade into the background. Where layout puts
   * two of them on top of each other, a faded node winning the stack would hide
   * the run the reader asked to see, so the spotlighted ones are lifted a layer.
   */
  const displayNodes: MergedNode[] = nodes.map((node) => {
    const dimmed =
      spotlight !== "both" && !nodeInRun(node.data.diff.status, spotlight);
    return {
      ...node,
      data: { ...node.data, spotlight, singleRun },
      zIndex: dimmed ? 0 : 1,
      style: { ...node.style, opacity: dimmed ? 0.35 : 1 },
    } as MergedNode;
  });

  const displayEdges = baseEdges.map((edge) => {
    const membership = edge.data?.membership ?? "unchanged";
    const dimmed = spotlight !== "both" && !edgeInRun(membership, spotlight);
    return {
      ...edge,
      style: {
        ...edge.style,
        stroke: EDGE_STROKE[membership],
        strokeWidth: 2,
        opacity: dimmed ? 0.15 : 1,
      },
    };
  });

  const spotlightModes: {
    value: SpotlightMode;
    label: string;
    title: string;
  }[] = [
    { value: "both", label: "Both", title: "Show both runs" },
    { value: "a", label: "A", title: `Highlight run A · ${nameA}` },
    { value: "b", label: "B", title: `Highlight run B · ${nameB}` },
  ];

  return (
    <BlockStack gap="2" className="h-full w-full">
      <InlineStack
        align="space-between"
        blockAlign="center"
        gap="4"
        wrap="wrap"
        className="w-full"
      >
        <InlineStack gap="3" blockAlign="center" wrap="wrap">
          {!singleRun && (
            <InlineStack gap="1" blockAlign="center">
              <Text as="span" size="sm" tone="subdued">
                Highlight
              </Text>
              {spotlightModes.map(({ value, label, title }) => (
                <Button
                  key={value}
                  size="sm"
                  variant={spotlight === value ? "default" : "outline"}
                  aria-pressed={spotlight === value}
                  title={title}
                  onClick={() => setSpotlight(value)}
                  {...tracking("compare_runs.graph.highlight", { run: value })}
                >
                  {label}
                </Button>
              ))}
            </InlineStack>
          )}
          <Text as="span" size="xs" tone="subdued">
            {singleRun ? nameA || nameB : `A · ${nameA} vs B · ${nameB}`}
          </Text>
        </InlineStack>

        {!singleRun && (
          <InlineStack gap="3" blockAlign="center" wrap="wrap">
            {LEGEND_ORDER.map((status) => (
              <InlineStack key={status} gap="1" blockAlign="center">
                <span
                  className={cn("h-2.5 w-2.5 rounded-sm", SWATCH[status])}
                />
                <Text as="span" size="xs" tone="subdued">
                  {diffStatusLabel(status, spotlight)}
                </Text>
              </InlineStack>
            ))}
          </InlineStack>
        )}
      </InlineStack>

      <BlockStack
        gap="0"
        className="min-h-0 w-full flex-1 overflow-hidden rounded-lg border"
      >
        <ReactFlow
          {...FLOW_CANVAS_DEFAULT_PROPS}
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
            track("compare_runs.graph.node.inspect", {
              diff_status: base.find((candidate) => candidate.id === node.id)
                ?.data.diff.status,
            });
          }}
          nodesConnectable={false}
          nodesDraggable={false}
          edgesFocusable={false}
          deleteKeyCode={null}
          onPaneClick={() => setSelectedNodeId(null)}
        >
          <Background />
          <Controls showInteractive={false} />
          {singleRun && (
            <Panel position="top-center">
              <InlineStack
                gap="2"
                blockAlign="center"
                wrap="nowrap"
                className="rounded-full border bg-background/95 px-3 py-1 shadow-sm"
              >
                <Icon
                  name="GitCompare"
                  size="xs"
                  className="text-muted-foreground"
                />
                <Text as="span" size="xs" tone="subdued">
                  Select a second run to see what changed.
                </Text>
              </InlineStack>
            </Panel>
          )}
          {spotlight !== "both" && (
            <Panel position="top-left">
              <InlineStack
                gap="2"
                blockAlign="center"
                wrap="nowrap"
                className={cn(
                  "max-w-80 rounded-md border px-2 py-1 shadow-sm",
                  RUN_TONE[spotlight],
                )}
              >
                <Text
                  as="span"
                  size="xs"
                  weight="bold"
                  className="text-inherit"
                >
                  {spotlight === "a" ? labelA : labelB}
                </Text>
                <Text
                  as="span"
                  size="sm"
                  weight="semibold"
                  className="truncate text-inherit"
                >
                  {spotlight === "a" ? nameA : nameB}
                </Text>
              </InlineStack>
            </Panel>
          )}
        </ReactFlow>
      </BlockStack>

      <Popover
        open={selectedNode != null}
        onOpenChange={(open) => {
          if (!open) setSelectedNodeId(null);
        }}
      >
        {selectedNodeId && <NodeScreenAnchor nodeId={selectedNodeId} />}
        {selectedNode && (
          <PopoverContent
            side="top"
            align="center"
            sideOffset={12}
            collisionPadding={12}
            onOpenAutoFocus={(event) => event.preventDefault()}
            className="max-h-96 w-80 overflow-y-auto overscroll-contain"
          >
            <BlockStack gap="3">
              <InlineStack
                align="space-between"
                blockAlign="start"
                gap="2"
                className="w-full"
              >
                <Text as="span" size="sm" weight="semibold">
                  {selectedNode.type === "mergedTask"
                    ? taskDisplayName(selectedNode.data.diff)
                    : selectedNode.data.diff.name}
                </Text>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close details"
                  onClick={() => setSelectedNodeId(null)}
                  className="-mt-2 -mr-2 size-7 shrink-0"
                  {...tracking("compare_runs.graph.node.close")}
                >
                  <Icon name="X" size="sm" />
                </Button>
              </InlineStack>
              {selectedNode.type === "mergedTask" ? (
                <TaskDiffDetail
                  diff={selectedNode.data.diff}
                  labelA={labelA}
                  labelB={labelB}
                  nameA={nameA}
                  nameB={nameB}
                />
              ) : (
                <IoDiffDetail
                  diff={selectedNode.data.diff}
                  labelA={labelA}
                  labelB={labelB}
                />
              )}
            </BlockStack>
          </PopoverContent>
        )}
      </Popover>
    </BlockStack>
  );
}

/**
 * Mirrors a node's on-screen box as a fixed, invisible popover anchor, so the
 * detail panel can be portalled to the body and overlay the page. A
 * `NodeToolbar` can't: it portals inside the canvas, whose `overflow-hidden`
 * clips it. Kept a separate component so the per-frame viewport subscription
 * re-renders only the anchor while panning, not the canvas.
 */
function NodeScreenAnchor({ nodeId }: { nodeId: string }) {
  const { zoom } = useViewport();
  const { flowToScreenPosition, getInternalNode } = useReactFlow();

  const node = getInternalNode(nodeId);
  if (!node) return null;

  const { x, y } = flowToScreenPosition(node.internals.positionAbsolute);

  return (
    <PopoverAnchor asChild>
      <div
        aria-hidden
        className="pointer-events-none fixed"
        style={{
          left: x,
          top: y,
          width: (node.measured.width ?? 0) * zoom,
          height: (node.measured.height ?? 0) * zoom,
        }}
      />
    </PopoverAnchor>
  );
}
