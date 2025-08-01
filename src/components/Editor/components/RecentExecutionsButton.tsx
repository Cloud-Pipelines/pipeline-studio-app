import { List } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { usePipelineRuns } from "@/providers/PipelineRunsProvider";

import RecentExecutions from "./RecentExecutions";

export const RecentExecutionsButton = () => {
  const { runs } = usePipelineRuns();
  const { componentSpec } = useComponentSpec();

  return (
    <Popover>
      <PopoverTrigger
        data-popover-trigger
        className="cursor-pointer border border-gray-200 rounded-md p-1 hover:bg-gray-200"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <List className="w-4 h-4" />
          </TooltipTrigger>
          <TooltipContent>Recent Pipeline Runs ({runs.length})</TooltipContent>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent className="w-[500px]">
        <RecentExecutions pipelineName={componentSpec.name} />
      </PopoverContent>
    </Popover>
  );
};
