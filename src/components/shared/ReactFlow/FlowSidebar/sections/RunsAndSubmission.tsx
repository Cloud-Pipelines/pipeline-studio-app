import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import OasisSubmitter from "@/components/shared/OasisSubmitter";
import RunOverview from "@/components/shared/RunOverview";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [runsIsOpen, setRunsIsOpen] = useState(false);

  const { pipelineRuns, refetch } = useLoadPipelineRuns(
    componentSpec.name || "",
  );

  const handleRunsCollapsedChange = (e: boolean) => {
    setRunsIsOpen(e);
  };

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

  const runsStyle = runsIsOpen ? "block" : "hidden";

  return (
    <Collapsible
      className="group/collapsible"
      onOpenChange={handleRunsCollapsedChange}
    >
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger>
            Runs & Submissions
            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
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
        </CollapsibleContent>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <ScrollArea
                className={cn(
                  "bg-gray-100 border rounded-sm",
                  runsStyle,
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
    </Collapsible>
  );
};

export default RunsAndSubmission;
