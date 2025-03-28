import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { ListPipelineJobsResponse } from "@/api/types.gen";
import RunListItem from "@/components/PipelineRow/RunListItem";
import { PipelineSection } from "@/components/PipelineSection";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL } from "@/utils/constants";

const Home = () => {
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [previousPageTokens, setPreviousPageTokens] = useState<string[]>([]);

  const { data, isLoading: isLoadingUserRuns } =
    useQuery<ListPipelineJobsResponse>({
      queryKey: ["runs", pageToken],
      queryFn: async () => {
        const pageTokenParam = pageToken ? `?page_token=${pageToken}` : "";
        const url = `${API_URL}/api/pipeline_runs/${pageTokenParam}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch pipeline runs: ${response.statusText}`
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

  return (
    <div className="container mx-auto w-3/4 p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pipelines</h1>
      </div>
      <Tabs defaultValue="runs" className="w-full">
        <TabsList>
          <TabsTrigger value="runs">All Runs</TabsTrigger>
          <TabsTrigger value="pipelines">My pipelines</TabsTrigger>
        </TabsList>
        <TabsContent value="pipelines">
          <PipelineSection />
        </TabsContent>
        <TabsContent value="runs" className="flex flex-col gap-1">
          {isLoadingUserRuns && (
            <div className="flex gap-2 items-center">
              <Spinner /> Loading...
            </div>
          )}

          {!isLoadingUserRuns &&
            (!data?.pipeline_runs || data?.pipeline_runs?.length === 0) && (
              <div>No runs found. Run a pipeline to see it here.</div>
            )}

          {data?.pipeline_runs?.map((run) => (
            <RunListItem
              key={run.root_execution_id}
              runId={run.root_execution_id}
            />
          ))}

          {(data?.next_page_token || previousPageTokens.length > 0) && (
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Home;
