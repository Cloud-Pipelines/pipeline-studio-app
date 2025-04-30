import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { API_URL } from "@/utils/constants";

const LogDisplay = ({
  logs,
}: {
  logs: {
    log_text?: string;
    system_error_exception_full?: string;
  };
}) => {
  if (!logs.log_text && !logs.system_error_exception_full) {
    return <div>No logs available</div>;
  }
  const lines = logs?.log_text?.split("\n") || [];
  const errorLines = logs?.system_error_exception_full?.split("\n") || [];
  return (
    <div className="space-y-1">
      {lines.map((line: string, index: number) => (
        <div key={index}>{formatLogLine(line)}</div>
      ))}
      {errorLines.map((line: string, index: number) => (
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
  const response = await fetch(
    `${API_URL}/api/executions/${executionId}/container_log`,
  );
  return response.json();
};

const Logs = ({ executionId }: { executionId?: string | number }) => {
  const [logs, setLogs] = useState<{ log_text: string }>();
  const {
    data,
    isLoading: isLoadingLogs,
    error,
  } = useQuery({
    queryKey: ["logs", executionId],
    queryFn: () => getLogs(String(executionId)),
    enabled: !!executionId,
    refetchInterval: 1000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (data && !error) {
      setLogs({ log_text: data.log_text });
    }

    if (error) {
      setLogs({ log_text: "No logs available" });
    }
  }, [data, error]);

  if (isLoadingLogs && !logs) {
    return <div>Loading...</div>;
  }
  return (
    <div className="space-y-4">
      <div className="font-mono text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
        {logs && <LogDisplay logs={logs} />}
      </div>
    </div>
  );
};

export default Logs;
