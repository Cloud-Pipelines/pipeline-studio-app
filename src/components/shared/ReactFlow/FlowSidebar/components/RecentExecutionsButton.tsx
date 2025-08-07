import { List } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { usePipelineRuns } from "@/providers/PipelineRunsProvider";

import RecentExecutions from "./RecentExecutions";

export const RecentExecutionsButton = ({
  tooltipPosition = "top",
}: {
  tooltipPosition?: "top" | "right";
}) => {
  const { runs } = usePipelineRuns();
  const { componentSpec } = useComponentSpec();

  return (
    <Popover>
      <PopoverTrigger data-popover-trigger>
        <SidebarMenuButton
          asChild
          tooltip={`Recent Pipeline Runs (${runs.length})`}
          forceTooltip
          tooltipPosition={tooltipPosition}
          className="text-black/80 rounded-md font-medium transition hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring cursor-pointer py-2 px-3"
        >
          <List className="w-4 h-4" />
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent className="w-[500px]">
        <RecentExecutions pipelineName={componentSpec.name} />
      </PopoverContent>
    </Popover>
  );
};
