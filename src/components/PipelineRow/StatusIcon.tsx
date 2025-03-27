import { CircleAlert, CircleCheck, CircleHelp, RefreshCcw } from "lucide-react";

const StatusIcon = ({ status }: { status?: string }) => {
  switch (status) {
    case "SUCCEEDED":
      return <CircleCheck className="w-4 h-4 text-green-500" />;
    case "FAILED":
    case "SYSTEM_ERROR":
    case "INVALID":
    case "UPSTREAM_FAILED":
    case "UPSTREAM_FAILED_OR_SKIPPED":
      return <CircleAlert className="w-4 h-4 text-red-500" />;
    case "RUNNING":
    case "STARTING":
    case "CANCELLING":
      return <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin" />;
    default:
      return <CircleHelp className="w-4 h-4 text-orange-500" />;
  }
};

export default StatusIcon;
