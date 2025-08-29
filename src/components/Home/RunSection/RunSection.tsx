import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronFirst, ChevronLeft, ChevronRight } from "lucide-react";
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

type RunSectionSearch = { page_token?: string; filter?: string };

export const RunSection = () => {
  const { backendUrl, configured, available } = useBackend();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const search = useSearch({ strict: false }) as RunSectionSearch;

  // Parse filter into a dictionary
  const parseFilter = (filter?: string): Record<string, string> => {
    if (!filter) return {};

    const filterDict: Record<string, string> = {};
    const parts = filter.split(",");

    for (const part of parts) {
      const [key, value] = part.split(":");
      if (key && value) {
        filterDict[key.trim()] = value.trim();
      }
    }

    return filterDict;
  };

  const filterDict = parseFilter(search.filter);
  const createdByValue = filterDict.created_by;

  // Determine if toggle should be on and what text to show
  const useCreatedByMe = createdByValue !== undefined;
  const toggleText = createdByValue
    ? `Created by ${createdByValue}`
    : "Created by me";

  const pageToken = search.page_token;
  const [previousPageTokens, setPreviousPageTokens] = useState<string[]>([]);

  const { data, isLoading, isFetching, error, refetch } =
    useQuery<ListPipelineJobsResponse>({
      queryKey: ["runs", backendUrl, pageToken, search.filter],
      refetchOnWindowFocus: false,
      queryFn: async () => {
        const u = new URL(PIPELINE_RUNS_QUERY_URL, backendUrl);
        if (pageToken) u.searchParams.set(PAGE_TOKEN_QUERY_KEY, pageToken);
        if (search.filter) u.searchParams.set(FILTER_QUERY_KEY, search.filter);

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
  }, [backendUrl, search.filter, pageToken, refetch]);

  const handleFilterChange = (value: boolean) => {
    const nextSearch: RunSectionSearch = { ...search };
    delete nextSearch.page_token;

    if (value) {
      // If there's already a created_by filter, keep it; otherwise use "created_by:me"
      if (!filterDict.created_by) {
        nextSearch.filter = CREATED_BY_ME_FILTER;
      }
    } else {
      // Remove created_by from filter, but keep other filters
      const updatedFilterDict = { ...filterDict };
      delete updatedFilterDict.created_by;

      // Convert back to string format
      const remainingFilters = Object.entries(updatedFilterDict)
        .map(([key, value]) => `${key}:${value}`)
        .join(",");

      if (remainingFilters) {
        nextSearch.filter = remainingFilters;
      } else {
        delete nextSearch.filter;
      }
    }

    setPreviousPageTokens([]);
    navigate({ to: pathname, search: nextSearch });
  };

  const handleNextPage = () => {
    if (data?.next_page_token) {
      setPreviousPageTokens([...previousPageTokens, pageToken || ""]);
      navigate({
        to: pathname,
        search: { ...search, page_token: data.next_page_token },
      });
    }
  };

  const handlePreviousPage = () => {
    const previousToken = previousPageTokens[previousPageTokens.length - 1];
    setPreviousPageTokens(previousPageTokens.slice(0, -1));
    const nextSearch: RunSectionSearch = { ...search };
    if (previousToken) {
      nextSearch.page_token = previousToken;
    } else {
      delete nextSearch.page_token;
    }
    navigate({ to: pathname, search: nextSearch });
  };

  const handleFirstPage = () => {
    setPreviousPageTokens([]);
    const nextSearch: RunSectionSearch = { ...search };
    delete nextSearch.page_token;
    navigate({ to: pathname, search: nextSearch });
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
          <Label htmlFor="created-by-me">{toggleText}</Label>
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
        <Label htmlFor="created-by-me">{toggleText}</Label>
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleFirstPage}
              disabled={!pageToken}
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handlePreviousPage}
              disabled={previousPageTokens.length === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </div>
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
