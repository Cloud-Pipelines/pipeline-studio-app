import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";

import { type RunDetailParams, runDetailRoute } from "@/router";
import { API_URL, RUNS_BASE_PATH } from "@/utils/constants";

const LogDisplay = ({
  logs,
  isLoading,
}: {
  logs: {
    log_text: string;
  };
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!logs || !logs.log_text) {
    return <div>No logs available</div>;
  }

  const lines = logs.log_text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line: string, index: number) => (
        <div key={index}>{formatLogLine(line)}</div>
      ))}
    </div>
  );
};

const formatLogLine = (line: string) => {
  const timestampMatch = line.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  if (!timestampMatch) return line;

  const timestamp = new Date(timestampMatch[0]);
  const content = line.slice(timestampMatch[0].length + 1);

  return (
    <div key={line} className="flex">
      <span className="text-gray-400 mr-4 select-none whitespace-nowrap shrink-0">
        {timestamp.toLocaleTimeString()}
      </span>
      <span className="break-all">{content}</span>
    </div>
  );
};

const getLogs = async (executionId: string) => {
  const response = await fetch(`${API_URL}/api/executions/${executionId}/logs`);
  return response.json();
};

const LogsInner = () => {
  const { id: executionId } = runDetailRoute.useParams() as RunDetailParams;

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["logs", executionId],
    queryFn: () => getLogs(executionId),
    enabled: !!executionId,
  });

  if (isLoadingLogs) {
    return <div>Loading...</div>;
  }

  if (!logs) {
    return <div>No logs available</div>;
  }
  return (
    <div className="space-y-4">
      <div className="font-mono text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
        <LogDisplay logs={logs} isLoading={isLoadingLogs} />
      </div>
    </div>
  );
};

const Logs = () => {
  const location = useLocation();

  const isRunDetailRoute = location.pathname.includes(RUNS_BASE_PATH);

  if (!isRunDetailRoute) {
    return null;
  }

  return <LogsInner />;
};

export default Logs;
