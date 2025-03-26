import { useQuery } from "@tanstack/react-query";
import { Terminal } from "lucide-react";
import { useEffect, useState } from "react";

import type { ListPipelineJobsResponse } from "@/api/types.gen";
import NewExperimentDialog from "@/components/NewExperiment";
import PipelineRow from "@/components/PipelineRow";
import RunListItem from "@/components/PipelineRow/RunListItem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type ComponentFileEntry,
  getAllComponentFilesFromList,
} from "@/componentStore";
import { API_URL, USER_PIPELINES_LIST_NAME } from "@/utils/constants";

const Home = () => {
  const [userPipelines, setUserPipelines] = useState<
    Map<string, ComponentFileEntry>
  >(new Map());
  const [isLoadingUserPipelines, setIsLoadingUserPipelines] = useState(false);

  const { data, isLoading: isLoadingUserRuns } =
    useQuery<ListPipelineJobsResponse>({
      queryKey: ["runs"],
      queryFn: async () => {
        const response = await fetch(`${API_URL}/api/pipeline_runs/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch pipeline runs: ${response.statusText}`,
          );
        }
        return response.json();
      },
    });

  useEffect(() => {
    fetchUserPipelines();
  }, []);

  const fetchUserPipelines = async () => {
    setIsLoadingUserPipelines(true);
    try {
      const pipelines = await getAllComponentFilesFromList(
        USER_PIPELINES_LIST_NAME,
      );
      setUserPipelines(pipelines);
    } catch (error) {
      console.error("Failed to load user pipelines:", error);
    } finally {
      setIsLoadingUserPipelines(false);
    }
  };

  const refreshAll = () => {
    fetchUserPipelines();
  };

  return (
    <div className="container mx-auto w-3/4 p-4 flex flex-col gap-4">
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          Your pipelines are stored in your browser&apos;s local storage.
          Clearing your browser data or cookies will delete all saved pipelines.
          Consider exporting important pipelines to files for backup.
        </AlertDescription>
      </Alert>
      <h1 className="text-2xl font-bold">Pipelines</h1>
      <Tabs defaultValue="pipelines" className="w-full">
        <TabsList>
          <TabsTrigger value="pipelines">My pipelines</TabsTrigger>
          <TabsTrigger value="runs">All Runs</TabsTrigger>
        </TabsList>
        <TabsContent value="pipelines">
          {isLoadingUserPipelines && (
            <div className="flex gap-2 items-center">
              <Spinner /> Loading...
            </div>
          )}

          {!isLoadingUserPipelines && userPipelines.size === 0 && (
            <div>
              <p>No pipelines found.</p>
              <NewExperimentDialog />
            </div>
          )}

          {userPipelines.size > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Last run</TableHead>
                  <TableHead>Runs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(userPipelines.entries()).map(
                  ([name, fileEntry]) => (
                    <PipelineRow
                      key={fileEntry.componentRef.digest}
                      componentRef={fileEntry.componentRef}
                      name={name.replace(/_/g, " ")}
                    />
                  ),
                )}
              </TableBody>
            </Table>
          )}
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
        </TabsContent>
      </Tabs>

      <Button onClick={refreshAll} className="mt-6">
        Refresh
      </Button>
    </div>
  );
};

export default Home;
