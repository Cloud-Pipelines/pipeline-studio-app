import { cn } from "@/lib/utils";
import type { TaskStatusCounts } from "@/types/pipelineRun";

const StatusText = ({
  statusCounts,
  shorthand,
}: {
  statusCounts: TaskStatusCounts;
  shorthand?: boolean;
}) => {
  return (
    <div
      className={cn(
        "text-xs text-gray-500 items-center",
        !shorthand && "flex gap-2",
      )}
    >
      {Object.entries(statusCounts).map(([key, count]) => {
        if (key === "total") return;

        if (count === 0) return;

        const statusColors: Record<string, string> = {
          succeeded: "text-green-500",
          failed: "text-red-500",
          running: "text-blue-500",
          skipped: "text-gray-800",
          waiting: "text-gray-500",
          cancelled: "text-gray-800",
        };
        const statusText = shorthand
          ? `${key[0]}`
          : `${key}${count > 1 ? " " : ""}`;

        const statusColor = statusColors[key];

        if (shorthand) {
          return (
            <span key={key} className="group">
              <span className={statusColor}>
                {count}
                {statusText}
              </span>
              <span className="group-last:hidden"> • </span>
            </span>
          );
        }
        return (
          <span key={key} className="flex items-center">
            <span className={statusColor}>
              {count} {statusText.trim()}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export default StatusText;
