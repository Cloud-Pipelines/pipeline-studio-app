import { useState, useEffect } from "react";
import {
  getAllComponentFilesFromList,
  type ComponentFileEntry,
} from "@/componentStore";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";
import { Accordion } from "@/components/ui/accordion";
import PipelineCard from "@/components/PipelineCard";

const Home = () => {
  const [userPipelines, setUserPipelines] = useState<
    Map<string, ComponentFileEntry>
  >(new Map());
  const [isLoadingUserPipelines, setIsLoadingUserPipelines] = useState(false);

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

  if (isLoadingUserPipelines) {
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
      {userPipelines.size > 0 && (
        <div className="flex flex-col">
          <div className="grid grid-cols-3 items-center p-2 w-full">
            <div>Title</div>
            <div className="text-center">Tasks</div>
            <div className="text-right">Last run</div>
          </div>
          <div>
            <Accordion type="single" collapsible className="w-full">
              {Array.from(userPipelines.entries()).map(([name, fileEntry]) => (
                <PipelineCard
                  key={fileEntry.componentRef.digest}
                  componentRef={fileEntry.componentRef}
                  name={name.replace(/_/g, " ")}
                />
              ))}
            </Accordion>
          </div>
        </div>
      )}

      <Button onClick={refreshAll} className="mt-6">
        Refresh
      </Button>
    </div>
  );
};

export default Home;
