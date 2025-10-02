import { useEffect, useState } from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { useBackend } from "@/providers/BackendProvider";
import {
  useFetchExecutionInfo,
  useFetchPipelineRun,
} from "@/services/executionService";

type PipelineLoadState =
  | { status: "idle" }
  | { status: "loading-execution" }
  | { status: "loading-run" }
  | {
      status: "success";
      executionData: {
        details: GetExecutionInfoResponse;
        state: GetGraphExecutionStateResponse;
      };
    }
  | { status: "error"; error: string };

export const useRunDataFromRootExecutionIdOrRunId = (id: string) => {
  const { backendUrl, ready } = useBackend();

  const [state, setState] = useState<PipelineLoadState>({ status: "idle" });
  const [rootExecutionId, setRootExecutionId] = useState<string>("");

  // Reset state when ID changes
  useEffect(() => {
    setState({ status: "idle" });
    setRootExecutionId("");
  }, [id]);

  // Start loading when ready
  useEffect(() => {
    if (state.status === "idle" && ready) {
      setState({ status: "loading-execution" });
      setRootExecutionId(id);
    }
  }, [state.status, ready, id]);

  // Try loading as execution ID
  const executionQuery = useFetchExecutionInfo(
    rootExecutionId,
    backendUrl,
    false,
    state.status === "loading-execution" && !!rootExecutionId,
    false,
  );

  // Try loading as run ID
  const runQuery = useFetchPipelineRun(
    id,
    backendUrl,
    state.status === "loading-run",
    false,
  );

  // Handle execution query results
  useEffect(() => {
    if (state.status !== "loading-execution") return;

    if (executionQuery.data?.details && executionQuery.data?.state) {
      setState({
        status: "success",
        executionData: {
          details: executionQuery.data.details,
          state: executionQuery.data.state,
        },
      });
    } else if (executionQuery.error && !executionQuery.isLoading) {
      setState({ status: "loading-run" });
    }
  }, [
    executionQuery.data,
    executionQuery.error,
    executionQuery.isLoading,
    state.status,
  ]);

  // Handle run query results
  useEffect(() => {
    if (state.status !== "loading-run") return;

    if (runQuery.data?.root_execution_id) {
      setRootExecutionId(runQuery.data.root_execution_id);
      setState({ status: "loading-execution" });
    } else if (runQuery.error && !runQuery.isLoading) {
      const errorMessage =
        runQuery.error instanceof Error
          ? runQuery.error.message
          : "Failed to load pipeline run";
      setState({ status: "error", error: errorMessage });
    }
  }, [runQuery.data, runQuery.error, runQuery.isLoading, state.status]);

  const isLoading = ["idle", "loading-execution", "loading-run"].includes(
    state.status,
  );
  const error = state.status === "error" ? new Error(state.error) : null;
  const executionData = state.status === "success" ? state.executionData : null;

  return {
    executionData,
    rootExecutionId,
    isLoading,
    error,
  };
};
