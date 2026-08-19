import type { IconName } from "@/components/ui/icon";
import type { PinnedArtifact, Trigger } from "@/shell/contracts";
import { apiUrl } from "@/shell/lib/basePath";
import { isViewableArtifact, resolveUrl } from "@/shell/lib/markdown/artifact";

/**
 * A session resource the user (or an agent) created, surfaced in the sidebar as
 * a card and openable in its own in-app tab. The `kind` discriminates which
 * TabView renders it; the leading icon (see {@link ASSET_ICON}) conveys the
 * type at a glance.
 *
 * `page` and `file` are both pinned artifacts: `page` is browser-viewable
 * (HTML, PDF, image, text) and opens in a sandboxed iframe tab, while `file`
 * is any other artifact (opened/downloaded in a new browser tab).
 */
export type Asset =
  | {
      kind: "page";
      /**
       * Stable identity: the resolved artifact URL. Matches the id a chat
       * artifact chip uses to open the same artifact, so both dedupe to one tab.
       */
      id: string;
      title: string;
      /** Resolved URL under the session file API. */
      url: string;
      /** Workspace-relative path (used to unpin). */
      path: string;
    }
  | {
      kind: "file";
      id: string;
      title: string;
      url: string;
      path: string;
    }
  | {
      kind: "trigger";
      /** Stable identity: the trigger id. */
      id: string;
      title: string;
      trigger: Trigger;
    };

/** Discriminant union of every asset kind, including reserved future kinds. */
export type AssetKind = Asset["kind"] | "app";

/** Leading icon per asset kind. `app` is reserved for a future asset type. */
export const ASSET_ICON: Record<AssetKind, IconName> = {
  page: "FileText",
  file: "Paperclip",
  trigger: "Zap",
  app: "AppWindow",
};

/** Short, human-readable subtitle describing a trigger's signal source. */
export function triggerSubtitle(trigger: Trigger): string {
  if (trigger.kind === "schedule") {
    const every = trigger.schedule?.every ?? trigger.schedule?.cron;
    return every ? `Every ${every}` : "Schedule";
  }
  return "Callback";
}

/** The secondary line shown beneath an asset's title in its card. */
export function assetSubtitle(asset: Asset): string {
  switch (asset.kind) {
    case "page":
      return "Page";
    case "file":
      return "File";
    case "trigger":
      return triggerSubtitle(asset.trigger);
  }
}

interface BuildAssetsArgs {
  sessionId: string;
  artifacts: PinnedArtifact[];
  triggers: Trigger[];
}

/**
 * Projects the session's pinned artifacts and triggers into a single, uniform
 * list of {@link Asset}s. Artifacts come first (most recently pinned ordering
 * is preserved from the server), then triggers. No server state is added here;
 * this is a pure view-model derivation.
 */
export function buildAssets({
  sessionId,
  artifacts,
  triggers,
}: BuildAssetsArgs): Asset[] {
  const base = apiUrl(`/api/sessions/${sessionId}/files`);

  const artifactAssets: Asset[] = artifacts.map((artifact) => {
    const url = resolveUrl(artifact.path, base) ?? artifact.path;
    return {
      kind: isViewableArtifact(artifact.path) ? "page" : "file",
      id: url,
      title: artifact.title,
      url,
      path: artifact.path,
    };
  });

  const triggerAssets: Asset[] = triggers.map((trigger) => ({
    kind: "trigger",
    id: trigger.id,
    title: trigger.title ?? trigger.name,
    trigger,
  }));

  return [...artifactAssets, ...triggerAssets];
}
