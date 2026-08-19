import { useQuery } from "@tanstack/react-query";

import type { ListPipelineJobsResponse } from "@/api/types.gen";
import { useBackend } from "@/providers/BackendProvider";
import { fetchWithErrorHandling } from "@/utils/fetchWithErrorHandling";

const PIPELINE_RUNS_QUERY_URL = "/api/pipeline_runs/";
const PAGE_TOKEN_QUERY_KEY = "page_token";
const FILTER_QUERY_PARAM_KEY = "filter_query";
const INCLUDE_PIPELINE_NAME_QUERY_KEY = "include_pipeline_names";
const INCLUDE_EXECUTION_STATS_QUERY_KEY = "include_execution_stats";

interface UsePipelineRunListOptions {
  pageToken?: string;
  filterQuery?: string;
  onFetch?: () => void;
}

/**
 * Sole owner of the `["runs", backendUrl, pageToken, filterQuery]` cache entry.
 * The runs dashboard and the comparison run picker read the same list, so the URL
 * they build has to be the same one — otherwise adding a query param on one side
 * leaves the other silently reading a payload that lacks it.
 */
export function usePipelineRunList({
  pageToken,
  filterQuery,
  onFetch,
}: UsePipelineRunListOptions = {}) {
  const { backendUrl, configured, available } = useBackend();

  return useQuery<ListPipelineJobsResponse>({
    queryKey: ["runs", backendUrl, pageToken, filterQuery],
    refetchOnWindowFocus: false,
    enabled: configured && available,
    queryFn: async () => {
      if (!available) {
        throw new Error("Backend is not available");
      }

      const url = new URL(PIPELINE_RUNS_QUERY_URL, backendUrl);
      if (pageToken) url.searchParams.set(PAGE_TOKEN_QUERY_KEY, pageToken);
      if (filterQuery) {
        url.searchParams.set(FILTER_QUERY_PARAM_KEY, filterQuery);
      }
      url.searchParams.set(INCLUDE_PIPELINE_NAME_QUERY_KEY, "true");
      url.searchParams.set(INCLUDE_EXECUTION_STATS_QUERY_KEY, "true");

      onFetch?.();

      return fetchWithErrorHandling(url.toString());
    },
  });
}
