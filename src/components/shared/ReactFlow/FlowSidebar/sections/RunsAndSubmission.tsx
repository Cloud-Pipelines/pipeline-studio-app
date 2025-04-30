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
import useLoadPipelineRuns from "@/hooks/useLoadPipelineRuns";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";

const RunsAndSubmission = () => {
  const { componentSpec } = useComponentSpec();

  const { pipelineRuns, refetch } = useLoadPipelineRuns(
    componentSpec.name || "",
  );

  const runOverviews = useMemo(
    () =>
      pipelineRuns.map((run) => (
        <RunOverview
          key={run.id}
          run={run}
          config={{
            showStatus: true,
            showName: false,
            showExecutionId: false,
            showCreatedAt: true,
            showTaskStatusBar: true,
            showStatusCounts: true,
          }}
        />
      )),
    [pipelineRuns],
  );

  const runBoxStyle =
    pipelineRuns.length > 4 ? `h-[165px]` : `h-[${pipelineRuns.length * 50}px]`;

  return (
    <SidebarGroup>
      <SidebarGroupLabel asChild>
        <div className="flex items-center">
          <span className="font-medium text-sm">Runs & Submissions</span>
        </div>
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <OasisSubmitter
              componentSpec={componentSpec}
              onSubmitComplete={refetch}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>

      <SidebarGroupContent>
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
