import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SelectContent } from "./ui/select";
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  EyeIcon,
  RefreshCcw,
  CopyIcon,
} from "lucide-react";
import mockFetch from "@/utils/mockAPI";
import { Button } from "./ui/button";
import { Select } from "./ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RunCardProps {
  rootExecutionId: number;
}

const RunCard = ({ rootExecutionId }: RunCardProps) => {
  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ["run_details", rootExecutionId],
    queryFn: () =>
      mockFetch(
        `https://oasis.shopify.io/api/executions/${rootExecutionId}/details`,
      ).then((response) => response.json()),
  });

  // child_execution_status_stats
  const { data: stateData, isLoading: stateLoading } = useQuery({
    queryKey: ["run_state", rootExecutionId],
    queryFn: () =>
      mockFetch(
        `https://oasis.shopify.io/api/executions/${rootExecutionId}/state`,
      ).then((response) => response.json()),
  });

  if (detailsLoading || stateLoading) return <div>Loading...</div>;

  // Use only the API data for task execution IDs
  const childTaskExecutionIds = detailsData?.child_task_execution_ids || {};

  const childExecutionStatusStats =
    stateData?.child_execution_status_stats || {};

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return <CircleCheck className="w-4 h-4 text-green-500" />;
      case "FAILED":
      case "UPSTREAM_FAILED":
      case "SYSTEM_ERROR":
      case "INVALID":
      case "UPSTREAM_FAILED_OR_SKIPPED":
        return <CircleAlert className="w-4 h-4 text-red-500" />;
      case "RUNNING":
      case "STARTING":
      case "CANCELLING":
        return <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin" />;
      case "CONDITIONALLY_SKIPPED":
      case "CANCELLED":
        return <EyeIcon className="w-4 h-4 text-gray-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300"></div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return "text-green-600";
      case "FAILED":
      case "UPSTREAM_FAILED":
      case "SYSTEM_ERROR":
      case "INVALID":
      case "UPSTREAM_FAILED_OR_SKIPPED":
        return "text-red-600";
      case "RUNNING":
      case "STARTING":
      case "CANCELLING":
        return "text-blue-600";
      case "CONDITIONALLY_SKIPPED":
      case "CANCELLED":
        return "text-gray-600";
      default:
        return "text-gray-500";
    }
  };

  const taskStatuses = Object.entries(childTaskExecutionIds || {}).map(
    ([taskName, executionId]) => {
      const statusStats =
        childExecutionStatusStats?.[executionId as string] || {};
      const status = Object.keys(statusStats)[0] || "UNKNOWN";

      return {
        taskName,
        executionId,
        status,
      };
    },
  );

  // Determine overall run status
  const hasErrors = taskStatuses.some((task) =>
    [
      "FAILED",
      "UPSTREAM_FAILED",
      "SYSTEM_ERROR",
      "INVALID",
      "UPSTREAM_FAILED_OR_SKIPPED",
    ].includes(task.status),
  );
  const isRunning = taskStatuses.some((task) =>
    ["RUNNING", "STARTING", "CANCELLING"].includes(task.status),
  );
  const allSucceeded =
    taskStatuses.length > 0 &&
    taskStatuses.every((task) => task.status === "SUCCEEDED");

  const getRunStatusIcon = () => {
    if (hasErrors) {
      return <CircleAlert className="w-4 h-4 text-red-500" />;
    } else if (isRunning) {
      return <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin" />;
    } else if (allSucceeded) {
      return <CircleCheck className="w-4 h-4 text-green-500" />;
    } else {
      return <ChevronRight className="w-4 h-4" />;
    }
  };

  const getRunStatusClass = () => {
    if (hasErrors) {
      return "bg-red-50 hover:bg-red-100 border-red-200 text-red-700";
    } else if (allSucceeded) {
      return "bg-green-50 hover:bg-green-100 border-green-200 text-green-700";
    } else if (isRunning) {
      return "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700";
    } else {
      return "";
    }
  };

  const handleOpenInEditor = async () => {
    console.log("handleOpenInEditor");
  };

  const handleRunSelection = (value: string) => {
    console.log("handleRunSelection", value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {detailsData?.task_spec.componentRef.spec.name || "Run Details"}
        </CardTitle>
      </CardHeader>
      <CardContent></CardContent>
      <CardFooter className="flex justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleOpenInEditor} className="cursor-pointer">
                <EyeIcon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View run details</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleOpenInEditor} className="cursor-pointer">
                <CopyIcon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clone and edit run</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center gap-0 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 focus-within:ring-offset-background rounded-md">
          <Select onValueChange={handleRunSelection}>
            <SelectTrigger className="w-[180px] max-w-[180px] rounded-r-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
              <SelectValue placeholder="Node status" />
            </SelectTrigger>
            <SelectContent>
              {taskStatuses.map((task, index) => (
                <SelectItem key={index} value={task.executionId as string}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span>{task.taskName}</span>
                    <span
                      className={`ml-2 font-medium ${getStatusColor(task.status)}`}
                    >
                      {task.status}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className={`rounded-l-none border-l-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none ${getRunStatusClass()}`}
          >
            {getRunStatusIcon()}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RunCard;
