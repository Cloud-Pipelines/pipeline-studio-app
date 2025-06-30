import { useMemo } from "react";

import OasisSubmitter from "@/components/shared/OasisSubmitter";
import RunOverview from "@/components/shared/RunOverview";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { usePipelineRuns } from "@/providers/PipelineRunsProvider";

const RunsAndSubmission = ({ isOpen }: { isOpen: boolean }) => {
  const { componentSpec } = useComponentSpec();

  const { runs } = usePipelineRuns();

  const runOverviews = useMemo(
    () =>
      runs.map((run) => (
        <RunOverview
          key={run.id}
          run={run}
          config={{
            showStatus: true,
            showName: false,
            showExecutionId: false,
            showCreatedAt: true,
            showTaskStatusBar: true,
            showStatusCounts: "shorthand",
          }}
        />
      )),
    [runs],
  );

  const runBoxStyle =
    runs.length > 4 ? `h-[165px]` : `h-[${runs.length * 50}px]`;

  if (!isOpen) {
    return (
      <>
        <hr />
        <SidebarGroupContent className="mx-2! my-2!">
          <SidebarMenu>
            <SidebarMenuItem>
              <OasisSubmitter componentSpec={componentSpec} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Runs & Submissions</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <OasisSubmitter componentSpec={componentSpec} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>

      <SidebarGroupContent
        className={cn({
          hidden: !isOpen,
          "mt-2": true,
        })}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <ScrollArea
              className={cn(
                "bg-gray-100 border rounded-sm",
                runBoxStyle,
                runOverviews.length === 0 ? "hidden" : "",
              )}
            >
              <div className="flex flex-col">{runOverviews}</div>
            </ScrollArea>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default RunsAndSubmission;
