import { useState, useEffect } from "react";
import {
  getAllComponentFilesFromList,
  type ComponentFileEntry,
} from "@/componentStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";
import PipelineRow from "@/components/PipelineRow";
import { useQuery } from "@tanstack/react-query";
import RunListItem from "@/components/PipelineRow/RunListItem";

const Home = () => {
  const [userPipelines, setUserPipelines] = useState<
    Map<string, ComponentFileEntry>
  >(new Map());
  const [isLoadingUserPipelines, setIsLoadingUserPipelines] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["runs"],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/pipeline_runs/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((response) => response.json()),
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

  if (isLoadingUserPipelines || isLoading) {
    return <div>Loading pipelines...</div>;
  }

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
          {data?.pipeline_runs.map((run: { root_execution_id: number }) => (
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
