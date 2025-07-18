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

const CREATED_BY_ME_FILTER = "created_by:me";

const FILTER_QUERY_PARAM = "?filter=";

export const RunSection = () => {
  const { backendUrl, configured, available } = useBackend();

  const [useCreatedByMe, setUseCreatedByMe] = useState(false);
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [previousPageTokens, setPreviousPageTokens] = useState<string[]>([]);

  const filter = useCreatedByMe
    ? FILTER_QUERY_PARAM + CREATED_BY_ME_FILTER
    : "";

  const { data, isLoading, isFetching, error, refetch } =
    useQuery<ListPipelineJobsResponse>({
      queryKey: ["runs", pageToken],
      refetchOnWindowFocus: false,
      queryFn: async () => {
        const pageTokenParam = pageToken ? `?page_token=${pageToken}` : "";
        const url = `${backendUrl}/api/pipeline_runs/${pageTokenParam}${filter}`;

        try {
          const response = await fetch(url);
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
  }, [backendUrl, useCreatedByMe, refetch]);

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
          />
          <Label htmlFor="created-by-me">Created by me</Label>
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
        />
        <Label htmlFor="created-by-me">Created by me</Label>
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
