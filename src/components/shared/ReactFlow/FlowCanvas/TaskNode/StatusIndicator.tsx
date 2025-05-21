import {
  CheckCircleIcon,
  CircleDashedIcon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";

import type { ContainerExecutionStatus } from "@/api/types.gen";
import { cn } from "@/lib/utils";

type StatusIndicatorProps = {
  status?: ContainerExecutionStatus;
};

export const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  if (!status) return null;

  const { style, text, icon } = getRunStatus(status);

  return (
    <div
      className={cn(
        "absolute -z-1 -top-5 left-0 h-[35px] rounded-t-md px-2.5 py-1 text-[10px]",
        style,
      )}
    >
      <div className="flex items-center gap-1 font-mono text-white">
        {icon}
        {text}
      </div>
    </div>
  );
};

const getRunStatus = (status: ContainerExecutionStatus) => {
  switch (status) {
    case "SUCCEEDED":
      return {
        style: "bg-emerald-500",
        text: "Succeeded",
        icon: <CheckCircleIcon className="w-2 h-2" />,
      };
    case "FAILED":
    case "SYSTEM_ERROR":
    case "INVALID":
      return {
        style: "bg-red-700",
        text: "Failed",
        icon: <XCircleIcon className="w-2 h-2" />,
      };
    case "RUNNING":
      return {
        style: "bg-sky-500",
        text: "Running",
        icon: <Loader2Icon className="w-2 h-2 animate-spin" />,
      };
    case "PENDING":
      return {
        style: "bg-yellow-500",
        text: "Pending",
        icon: <ClockIcon className="w-2 h-2 animate-spin duration-2000" />,
      };
    case "CANCELLING":
    case "CANCELLED":
      return {
        style: "bg-orange-500",
        text: status === "CANCELLING" ? "Cancelling" : "Cancelled",
        icon: <XCircleIcon className="w-2 h-2" />,
      };
    case "SKIPPED":
      return {
        style: "bg-slate-400",
        text: "Skipped",
        icon: <XCircleIcon className="w-2 h-2" />,
      };
    case "QUEUED":
      return {
        style: "bg-yellow-500",
        text: "Queued",
        icon: <ClockIcon className="w-2 h-2 animate-spin duration-2000" />,
      };
    case "UNINITIALIZED":
    case "WAITING_FOR_UPSTREAM":
      return {
        style: "bg-slate-500",
        text: "Waiting for upstream",
        icon: <ClockIcon className="w-2 h-2 animate-spin duration-2000" />,
      };
    default:
      return {
        style: "bg-slate-300",
        text: "Unknown",
        icon: <CircleDashedIcon className="w-2 h-2" />,
      };
  }
};
