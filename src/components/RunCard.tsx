import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CopyIcon,
  EyeIcon,
  RefreshCcw,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { APP_ROUTES } from "@/utils/constants";

import { Button } from "./ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SelectContent } from "./ui/select";
import { Select } from "./ui/select";

interface RunCardProps {
  rootExecutionId: number;
}

const RunCard = ({ rootExecutionId }: RunCardProps) => {
  const navigate = useNavigate();
  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ["run_details", rootExecutionId],
    queryFn: () =>
      fetch(
        `${import.meta.env.VITE_BACKEND_API_URL ?? ""}/api/executions/${rootExecutionId}/details`,
      ).then((response) => response.json()),
  });

  // child_execution_status_stats
  const { data: stateData, isLoading: stateLoading } = useQuery({
    queryKey: ["run_state", rootExecutionId],
    queryFn: () =>
      fetch(
        `${import.meta.env.VITE_BACKEND_API_URL ?? ""}/api/executions/${rootExecutionId}/state`,
      ).then((response) => response.json()),
  });

  if (detailsLoading || stateLoading) return <div>Loading...</div>;

  // Use only the API data for task execution IDs
  const childTaskExecutionIds = detailsData?.child_task_execution_ids || {};

  const childExecutionStatusStats =
    stateData?.child_execution_status_stats || {};

  // Consolidated status utility function
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return {
          icon: <CircleCheck className="w-4 h-4 text-green-500" />,
          textColor: "text-green-600",
          bgClass:
            "bg-green-50 hover:bg-green-100 border-green-200 text-green-700",
        };
      case "FAILED":
      case "UPSTREAM_FAILED":
      case "SYSTEM_ERROR":
      case "INVALID":
      case "UPSTREAM_FAILED_OR_SKIPPED":
        return {
          icon: <CircleAlert className="w-4 h-4 text-red-500" />,
          textColor: "text-red-600",
          bgClass: "bg-red-50 hover:bg-red-100 border-red-200 text-red-700",
        };
      case "RUNNING":
      case "STARTING":
      case "CANCELLING":
        return {
          icon: <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin" />,
          textColor: "text-blue-600",
          bgClass: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700",
        };
      case "CONDITIONALLY_SKIPPED":
      case "CANCELLED":
        return {
          icon: <EyeIcon className="w-4 h-4 text-gray-500" />,
          textColor: "text-gray-600",
          bgClass: "",
        };
      default:
        return {
          icon: <div className="w-4 h-4 rounded-full bg-gray-300"></div>,
          textColor: "text-gray-500",
          bgClass: "",
        };
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

  const getRunStatusInfo = () => {
    if (hasErrors) {
      return getStatusInfo("FAILED");
    } else if (isRunning) {
      return getStatusInfo("RUNNING");
    } else if (allSucceeded) {
      return getStatusInfo("SUCCEEDED");
    } else {
      return {
        icon: <ChevronRight className="w-4 h-4" />,
        textColor: "",
        bgClass: "",
      };
    }
  };

  const handleViewRun = async () => {
    navigate({
      to: `${APP_ROUTES.RUNS}/${rootExecutionId}`,
    });
  };

  const handleCloneAndEdit = async () => {
    console.log("handleCloneAndEdit");
  };

  const handleRunSelection = (value: string) => {
    console.log("handleRunSelection", value);
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>
          {detailsData?.task_spec.componentRef.spec.name || "Run Details"}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex justify-between items-end">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleViewRun} className="cursor-pointer">
                  <EyeIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View run details</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleCloneAndEdit} className="cursor-pointer">
                  <CopyIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clone and edit run</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-0 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 focus-within:ring-offset-background rounded-md">
          <Select onValueChange={handleRunSelection}>
            <SelectTrigger className="w-[180px] max-w-[180px] rounded-r-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
              <SelectValue placeholder="Node status" />
            </SelectTrigger>
            <SelectContent>
              {taskStatuses.map((task, index) => (
                <SelectItem key={index} value={task.executionId as string}>
                  <div className="flex items-center gap-2">
                    {getStatusInfo(task.status).icon}
                    <span>{task.taskName}</span>
                    <span
                      className={`ml-2 font-medium ${getStatusInfo(task.status).textColor}`}
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
            className={`rounded-l-none border-l-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none ${getRunStatusInfo().bgClass}`}
          >
            {getRunStatusInfo().icon}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RunCard;
