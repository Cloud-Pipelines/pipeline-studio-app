import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import type { ListPipelineJobsResponse } from "@/api/types.gen";
import { InfoBox } from "@/components/shared/InfoBox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBackend } from "@/providers/BackendProvider";

import RunRow from "./RunRow";

const PIPELINE_RUNS_QUERY_URL = "/api/pipeline_runs/";
const PAGE_TOKEN_QUERY_KEY = "page_token";
const FILTER_QUERY_KEY = "filter";
const CREATED_BY_ME_FILTER = "created_by:me";

interface RunSectionProps {
  createdBy?: string;
}

export const RunSection = ({ createdBy }: RunSectionProps) => {
  const { backendUrl, configured, available } = useBackend();

  // If createdBy is provided via URL, use it. Otherwise default to false
  const [useCreatedByMe, setUseCreatedByMe] = useState(
    createdBy === "me" || false,
  );
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [previousPageTokens, setPreviousPageTokens] = useState<string[]>([]);

  const { data, isLoading, isFetching, error, refetch } =
    useQuery<ListPipelineJobsResponse>({
      queryKey: ["runs", pageToken, createdBy, useCreatedByMe],
      refetchOnWindowFocus: false,
      queryFn: async () => {
        const u = new URL(PIPELINE_RUNS_QUERY_URL, backendUrl);
        if (pageToken) u.searchParams.set(PAGE_TOKEN_QUERY_KEY, pageToken);

        // Use the filter logic consistently
        if (createdBy) {
          u.searchParams.set(FILTER_QUERY_KEY, `created_by:${createdBy}`);
        } else if (useCreatedByMe) {
          u.searchParams.set(FILTER_QUERY_KEY, CREATED_BY_ME_FILTER);
        }

        try {
          const response = await fetch(u.toString());
          if (!response.ok) {
            throw new Error(
              `Failed to fetch pipeline runs: ${response.statusText}`,
            );
          }
          return response.json();
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(error.message);
          } else {
            throw new Error("An unknown error occurred");
          }
        }
      },
    });

  useEffect(() => {
    refetch();
  }, [backendUrl, useCreatedByMe, createdBy, refetch]);

  // Update the toggle when URL parameter changes
  useEffect(() => {
    if (createdBy === "me") {
      setUseCreatedByMe(true);
    } else if (createdBy === undefined) {
      // Only reset if there's no URL parameter at all
      setUseCreatedByMe(false);
    }
  }, [createdBy]);

  const handleFilterChange = (value: boolean) => {
    setUseCreatedByMe(value);
    setPageToken(undefined);
    setPreviousPageTokens([]);
  };

  const handleNextPage = () => {
    if (data?.next_page_token) {
      setPreviousPageTokens([...previousPageTokens, pageToken || ""]);
      setPageToken(data.next_page_token);
    }
  };

  const handlePreviousPage = () => {
    const previousToken = previousPageTokens[previousPageTokens.length - 1];
    setPreviousPageTokens(previousPageTokens.slice(0, -1));
    setPageToken(previousToken);
  };

  if (!configured) {
    return (
      <InfoBox title="Backend not configured" variant="warning">
        Configure a backend to create and view runs.
      </InfoBox>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="flex gap-2 items-center">
        <Spinner /> Loading...
      </div>
    );
  }

  if (error) {
    const backendNotConfigured = "The backend is not configured.";
    const backendUnavailable =
      "The configured backend is currently unavailable.";
    const backendAvailableString = "The configured backend is available.";
    const backendStatusString = configured
      ? available
        ? backendAvailableString
        : backendUnavailable
      : backendNotConfigured;

    return (
      <InfoBox title="Error loading runs" variant="error">
        <div className="mb-2">{error.message}</div>
        <div className="text-black italic">{backendStatusString}</div>
      </InfoBox>
    );
  }

  if (!data) {
    return <div>Failed to load runs.</div>;
  }

  if (!data?.pipeline_runs || data?.pipeline_runs?.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="created-by-me"
            checked={useCreatedByMe}
            onCheckedChange={handleFilterChange}
            disabled={!!createdBy} // Disable if controlled by URL
          />
          <Label htmlFor="created-by-me">
            Created by me
            {createdBy && " (controlled by URL)"}
          </Label>
        </div>
        <div>No runs found. Run a pipeline to see it here.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center space-x-2">
        <Switch
          id="created-by-me"
          checked={useCreatedByMe}
          onCheckedChange={handleFilterChange}
          disabled={!!createdBy} // Disable if controlled by URL
        />
        <Label htmlFor="created-by-me">
          Created by me
          {createdBy && " (controlled by URL)"}
        </Label>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="w-1/3">Name</TableHead>
            <TableHead className="w-1/3">Status</TableHead>
            <TableHead className="w-1/6">Date</TableHead>
            <TableHead className="w-1/6">Initiated By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.pipeline_runs?.map((run) => (
            <RunRow key={run.id} run={run} />
          ))}
        </TableBody>
      </Table>

      {(data.next_page_token || previousPageTokens.length > 0) && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={previousPageTokens.length === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={!data?.next_page_token}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};
