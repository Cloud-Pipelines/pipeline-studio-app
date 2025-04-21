import type { TaskStatusCounts } from "./types";

const StatusText = ({
  statusCounts,
  shorthand,
}: {
  statusCounts: TaskStatusCounts;
  shorthand?: boolean;
}) => {
  return (
    <div className="text-xs text-gray-500 mt-1">
      {Object.entries(statusCounts).map(([key, count]) => {
        if (key === "total") return;

        if (count === 0) return;

        const statusColors: Record<string, string> = {
          succeeded: "text-green-500",
          failed: "text-red-500",
          running: "text-blue-500",
          skipped: "text-gray-800",
          waiting: "text-gray-500",
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
          <span key={key} className="flex items-center gap-1">
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
