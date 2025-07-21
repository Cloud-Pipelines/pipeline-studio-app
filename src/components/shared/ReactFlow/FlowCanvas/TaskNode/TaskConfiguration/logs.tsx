import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { ContainerExecutionStatus } from "@/api/types.gen";
import { CodeViewer } from "@/components/shared/CodeViewer";
import { InfoBox } from "@/components/shared/InfoBox";
import { Spinner } from "@/components/ui/spinner";
import { useBackend } from "@/providers/BackendProvider";
import { getBackendStatusString } from "@/utils/backend";

const LogDisplay = ({
  onFullscreenChange,
  logs,
}: {
  onFullscreenChange?: (isFullscreen: boolean) => void;
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

const isStatusActivelyLogging = (
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

const getLogs = async (executionId: string, backendUrl: string) => {
  const response = await fetch(
    `${backendUrl}/api/executions/${executionId}/container_log`,
  );
  return response.json();
};

const Logs = ({
  executionId,
  onFullscreenChange,
  status,
}: {
  executionId?: string | number;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  status?: ContainerExecutionStatus;
}) => {
  const { backendUrl, configured, available } = useBackend();

  const [isLogging, setIsLogging] = useState(!!executionId);
  const [logs, setLogs] = useState<{
    log_text?: string;
    system_error_exception_full?: string;
  }>();
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["logs", executionId],
    queryFn: () => getLogs(String(executionId), backendUrl),
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

  useEffect(() => {
    refetch();
  }, [backendUrl, refetch]);

  if (!configured) {
    return (
      <InfoBox title="Backend not configured" variant="warning">
        Configure a backend to view execution logs.
      </InfoBox>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="flex gap-2 items-center">
        <Spinner /> Loading Logs...
      </div>
    );
  }

  if (error) {
    const backendStatusString = getBackendStatusString(configured, available);
    return (
      <InfoBox title="Error loading logs" variant="error">
        <div className="mb-2">{error.message}</div>
        <div className="text-black italic">{backendStatusString}</div>
      </InfoBox>
    );
  }

  return (
    <div className="space-y-4 h-full">
      <div className="font-mono text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg h-full min-h-0 flex-1">
        {logs && (
          <LogDisplay logs={logs} onFullscreenChange={onFullscreenChange} />
        )}
      </div>
    </div>
  );
};

export default Logs;
