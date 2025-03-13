import { getAppSettings } from "@/appSettings";
import { useState, useEffect } from "react";
import { downloadDataWithCache, loadObjectFromYamlData } from "@/cacheUtils";
import {
  getAllComponentFilesFromList,
  type ComponentFileEntry,
} from "@/componentStore";

import { Button } from "@/components/ui/button";
import PipelineCard from "@/components/PipelineCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";

const Home = () => {
  const [appSettings] = useState(getAppSettings());
  const [pipelineLibrary, setPipelineLibrary] = useState<any>(null);
  const [userPipelines, setUserPipelines] = useState<
    Map<string, ComponentFileEntry>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserPipelines, setIsLoadingUserPipelines] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPipelineLibrary();
    fetchUserPipelines();
  }, []);

  const fetchPipelineLibrary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await downloadDataWithCache(
        appSettings.pipelineLibraryUrl,
        (data) => loadObjectFromYamlData(data),
      );
      setPipelineLibrary(data);
    } catch {
      setError("Failed to load pipeline library");
    } finally {
      setIsLoading(false);
    }
  };

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
    fetchPipelineLibrary();
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
      <h1 className="text-2xl font-bold">Pipeline Library</h1>

      {(isLoading || isLoadingUserPipelines) && <p>Loading pipelines...</p>}

      {error && <p className="text-red-500">{error}</p>}

      {userPipelines.size > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Pipelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(userPipelines.entries()).map(([name, fileEntry]) => (
              <PipelineCard
                key={fileEntry.componentRef.digest}
                componentRef={fileEntry.componentRef}
                name={name.replace(/_/g, " ")}
                canDelete
              />
            ))}
          </div>
        </div>
      )}

      {pipelineLibrary && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Sample Pipelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelineLibrary.components?.map(
              (component: any, index: number) => (
                <PipelineCard
                  key={index}
                  url={component.url}
                  name={component.name.replace(/_/g, " ")}
                />
              ),
            )}
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
