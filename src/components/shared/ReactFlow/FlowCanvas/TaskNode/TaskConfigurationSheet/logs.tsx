import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { ContainerExecutionStatus } from "@/api/types.gen";
import CodeViewer from "@/components/shared/CodeViewer";
import { API_URL } from "@/utils/constants";

const LogDisplay = ({
  onFullscreenChange,
  logs,
}: {
  onFullscreenChange: (isFullscreen: boolean) => void;
  logs: {
    log_text?: string;
    system_error_exception_full?: string;
  };
}) => {
  if (!logs.log_text && !logs.system_error_exception_full) {
    return <div>No logs available</div>;
  }

  return (
    <>
      {logs?.log_text && (
        <CodeViewer
          code={logs.log_text || ""}
          language="text"
          title="Logs"
          filename="logs"
          onFullscreenChange={onFullscreenChange}
        />
      )}
      {logs?.system_error_exception_full && (
        <CodeViewer
          code={logs?.system_error_exception_full || ""}
          language="text"
          title="Logs"
          filename="error"
          onFullscreenChange={onFullscreenChange}
        />
      )}
    </>
  );
};

export const isStatusActivelyLogging = (
  status?: ContainerExecutionStatus,
): boolean => {
  if (!status) {
    return false;
  }
  switch (status) {
    case "RUNNING":
    case "PENDING":
    case "QUEUED":
    case "WAITING_FOR_UPSTREAM":
    case "CANCELLING":
      return true;
    default:
      return false;
  }
};

const getLogs = async (executionId: string) => {
  const response = await fetch(
    `${API_URL}/api/executions/${executionId}/container_log`,
  );
  return response.json();
};

const Logs = ({
  executionId,
  onFullscreenChange,
  status,
}: {
  executionId?: string | number;
  onFullscreenChange: (isFullscreen: boolean) => void;
  status?: ContainerExecutionStatus;
}) => {
  const [isLogging, setIsLogging] = useState(!!executionId);
  const [logs, setLogs] = useState<{
    log_text?: string;
    system_error_exception_full?: string;
  }>();
  const {
    data,
    isLoading: isLoadingLogs,
    error,
  } = useQuery({
    queryKey: ["logs", executionId],
    queryFn: () => getLogs(String(executionId)),
    enabled: isLogging,
    refetchInterval: 1000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (status) {
      setIsLogging(isStatusActivelyLogging(status));
    }
  }, [status]);

  useEffect(() => {
    if (data && !error) {
      setLogs({
        log_text: data?.log_text,
        system_error_exception_full: data?.system_error_exception_full,
      });
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
        {logs && (
          <LogDisplay logs={logs} onFullscreenChange={onFullscreenChange} />
        )}
      </div>
    </div>
  );
};

export default Logs;
