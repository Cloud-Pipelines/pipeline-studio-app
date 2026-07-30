import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import type { ReactNode } from "react";

import { trimDigest } from "@/components/shared/ManageComponent/utils/digest";
import { StatusTab } from "@/components/shared/ReactFlow/FlowCanvas/TaskNode/StatusIndicator";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { QuickTooltip } from "@/components/ui/tooltip";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { MergedTaskNodeData } from "@/routes/v2/pages/CompareView/utils/buildMergedGraph";
import { summarizeTaskChange } from "@/routes/v2/pages/CompareView/utils/summarizeChange";

import { DiffStatusBadge } from "./DiffStatusBadge";
import { MEMBERSHIP_BORDER } from "./mergedNodeStyles";
import { SideValues } from "./SideValues";

function StatusTabRow({ children }: { children: ReactNode }) {
  return (
    <InlineStack
      gap="1"
      blockAlign="start"
      wrap="nowrap"
      className="absolute -top-5 left-0 right-0 w-full -z-1"
    >
      {children}
    </InlineStack>
  );
}

type MergedTaskNodeType = Node<MergedTaskNodeData, "mergedTask">;

export function MergedTaskNode({ data }: NodeProps<MergedTaskNodeType>) {
  const { diff, spotlight, singleRun } = data;

  const spotlightSide = spotlight === "b" ? "b" : "a";
  const side = spotlight === "b" ? diff.b : diff.a;
  const name =
    side?.componentRef.spec?.name ??
    diff.a?.componentRef.spec?.name ??
    diff.b?.componentRef.spec?.name ??
    diff.taskId;

  const changeSummary =
    diff.status === "changed" ? summarizeTaskChange(diff) : "";

  const changedArgs = diff.argumentDiffs.filter(
    (entry) => entry.status !== "unchanged",
  );
  const showSideValues = spotlight !== "both" && changedArgs.length > 0;

  const { componentChanged } = diff;
  const sideDigest =
    (spotlight === "b" ? diff.digestB : diff.digestA) ??
    diff.digestA ??
    diff.digestB;
  const digestFull =
    componentChanged && diff.digestA && diff.digestB
      ? `A: ${diff.digestA}\nB: ${diff.digestB}`
      : sideDigest;
  const digestDisplay =
    componentChanged && diff.digestA && diff.digestB
      ? `${trimDigest(diff.digestA)} → ${trimDigest(diff.digestB)}`
      : sideDigest
        ? trimDigest(sideDigest)
        : undefined;

  const cacheDisabled =
    spotlight === "b" ? diff.cacheDisabledB : diff.cacheDisabledA;
  const showCacheIcon = cacheDisabled || diff.cacheChanged;
  const cacheTooltip = diff.cacheChanged
    ? `Caching ${diff.cacheDisabledA ? "off" : "on"} in A, ${diff.cacheDisabledB ? "off" : "on"} in B`
    : "Caching disabled";

  const statusA = spotlight === "b" ? undefined : diff.statusA;
  const statusB = spotlight === "a" ? undefined : diff.statusB;
  const singleStatus = diff.statusA ?? diff.statusB;

  return (
    <BlockStack
      gap="1"
      className={cn(
        "relative w-64 rounded-lg border-2 bg-background px-3 py-2",
        MEMBERSHIP_BORDER[diff.status],
      )}
    >
      {singleRun
        ? singleStatus && (
            <StatusTabRow>
              <StatusTab status={singleStatus} className="min-w-0" />
            </StatusTabRow>
          )
        : (statusA || statusB) && (
            <StatusTabRow>
              {statusA ? (
                <StatusTab
                  status={statusA}
                  label="A"
                  className="min-w-0 flex-1"
                />
              ) : (
                <div className="flex-1" />
              )}
              {statusB ? (
                <StatusTab
                  status={statusB}
                  label="B"
                  className="min-w-0 flex-1"
                />
              ) : (
                <div className="flex-1" />
              )}
            </StatusTabRow>
          )}

      <InlineStack
        align="space-between"
        blockAlign="center"
        gap="1"
        wrap="nowrap"
        className="w-full"
      >
        <InlineStack
          gap="1"
          blockAlign="center"
          wrap="nowrap"
          className="shrink-0"
        >
          {!singleRun && (
            <DiffStatusBadge status={diff.status} spotlight={spotlight} />
          )}
          {showCacheIcon && (
            <QuickTooltip content={cacheTooltip}>
              <Icon
                name="ZapOff"
                size="xs"
                className={cn(
                  "shrink-0",
                  diff.cacheChanged ? "text-diff-changed" : "text-orange-400",
                )}
              />
            </QuickTooltip>
          )}
        </InlineStack>
        {digestDisplay && (
          <QuickTooltip content={digestFull ?? digestDisplay}>
            <Text
              as="span"
              size="xs"
              tone="subdued"
              className="max-w-[60%] truncate font-mono"
            >
              {digestDisplay}
            </Text>
          </QuickTooltip>
        )}
      </InlineStack>

      <Text as="span" size="sm" weight="semibold" className="wrap-break-word">
        {name}
      </Text>
      <Text as="span" size="xs" tone="subdued" className="font-mono break-all">
        {diff.taskId}
      </Text>
      {showSideValues ? (
        <SideValues fields={changedArgs} side={spotlightSide} />
      ) : (
        changeSummary && (
          <Text as="span" size="xs" tone="subdued">
            {changeSummary}
          </Text>
        )
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="border-0! bg-gray-500!"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="border-0! bg-gray-500!"
      />
    </BlockStack>
  );
}
