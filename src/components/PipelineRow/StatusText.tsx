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
      {Object.entries(statusCounts).map(([key, count], index, array) => {
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

        const isLastVisibleItem = array
          .slice(index + 1)
          .some(([nextKey, nextCount]) => nextKey !== "total" && nextCount > 0);

        return (
          <span key={key}>
            <span className={statusColors[key]}>
              {count}
              {shorthand ? statusText : ` ${statusText.trim()}`}
            </span>
            {!shorthand && isLastVisibleItem && (
              <span className="text-black">, </span>
            )}
            {shorthand && <span> </span>}
          </span>
        );
      })}
    </div>
  );
};

export default StatusText;
