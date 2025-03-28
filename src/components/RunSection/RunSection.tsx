import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { ListPipelineJobsResponse } from "@/api/types.gen";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { API_URL } from "@/utils/constants";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import RunRow from "./RunRow";

export const RunSection = () => {
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [previousPageTokens, setPreviousPageTokens] = useState<string[]>([]);

  const { data, isLoading } = useQuery<ListPipelineJobsResponse>({
    queryKey: ["runs", pageToken],
    queryFn: async () => {
      const pageTokenParam = pageToken ? `?page_token=${pageToken}` : "";
      const url = `${API_URL}/api/pipeline_runs/${pageTokenParam}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch pipeline runs: ${response.statusText}`,
        );
      }

      return response.json();
    },
  });

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

  if (isLoading) {
    return (
      <div className="flex gap-2 items-center">
        <Spinner /> Loading...
      </div>
    );
  }

  if (!data) {
    return <div>Failed to load runs.</div>;
  }

  if (!data?.pipeline_runs || data?.pipeline_runs?.length === 0) {
    return <div>No runs found. Run a pipeline to see it here.</div>;
  }

  return (
    <div>
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
          {data.pipeline_runs?.map((run) => <RunRow key={run.id} run={run} />)}
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
