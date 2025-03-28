import { useQuery } from "@tanstack/react-query";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { API_URL } from "@/utils/constants";

const fetchExecutionInfo = (executionId: string) => {
  const fetchDetails = async (): Promise<GetExecutionInfoResponse> => {
    const response = await fetch(
      `${API_URL}/api/executions/${executionId}/details`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch execution details: ${response.statusText}`
      );
    }
    return response.json();
  };

  const fetchState = async (): Promise<GetGraphExecutionStateResponse> => {
    const response = await fetch(
      `${API_URL}/api/executions/${executionId}/state`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch execution state: ${response.statusText}`
      );
    }
    return response.json();
  };

  const {
    data: details,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery<GetExecutionInfoResponse>({
    queryKey: ["pipeline-run-details", executionId],
    queryFn: fetchDetails,
  });

  const {
    data: state,
    isLoading: isStateLoading,
    error: stateError,
  } = useQuery<GetGraphExecutionStateResponse>({
    queryKey: ["pipeline-run-state", executionId],
    queryFn: fetchState,
  });

  const isLoading = isDetailsLoading || isStateLoading;
  const error = detailsError || stateError;
  const data = { state, details };

  return { data, isLoading, error };
};

export default fetchExecutionInfo;
