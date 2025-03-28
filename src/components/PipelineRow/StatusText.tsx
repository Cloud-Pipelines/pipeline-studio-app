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

        if (count > 0) {
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

          return (
            <span key={key}>
              <span className={statusColors[key]}>
                {count}
                {shorthand ? statusText : ` ${statusText.trim()}`}
              </span>
              {!shorthand && count > 1 && (
                <span className="text-black">, </span>
              )}
              {shorthand && <span> </span>}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
};

export default StatusText;
