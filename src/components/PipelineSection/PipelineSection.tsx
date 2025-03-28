import { Terminal } from "lucide-react";
import { useEffect, useState } from "react";

import NewExperimentDialog from "@/components/NewExperiment";
import PipelineRow from "@/components/PipelineRow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ComponentFileEntry,
  getAllComponentFilesFromList,
} from "@/componentStore";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";

import { Button } from "../ui/button";

export type Pipelines = Map<string, ComponentFileEntry>;

export const PipelineSection = () => {
  const [pipelines, setPipelines] = useState<Pipelines>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUserPipelines();
  }, []);

  const fetchUserPipelines = async () => {
    setIsLoading(true);
    try {
      const pipelines = await getAllComponentFilesFromList(
        USER_PIPELINES_LIST_NAME,
      );
      //  sort pipelines by pipeline.modificationTime
      const sortedPipelines = new Map(
        [...pipelines.entries()].sort((a, b) => {
          return new Date(b[1].modificationTime).getTime() - new Date(a[1].modificationTime).getTime();
        }),
      );
      setPipelines(sortedPipelines);
    } catch (error) {
      console.error("Failed to load user pipelines:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAll = () => {
    fetchUserPipelines();
  };

  if (isLoading) {
    return (
      <div className="flex gap-2 items-center">
        <Spinner /> Loading...
      </div>
    );
  }

  if (pipelines.size === 0) {
    return (
      <div>
        <p>No pipelines found.</p>
        <NewExperimentDialog />
      </div>
    );
  }


  return (
    <div>
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          Your pipelines are stored in your browser&apos;s local storage.
          Clearing your browser data or cookies will delete all saved pipelines.
          Consider exporting important pipelines to files for backup.
        </AlertDescription>
      </Alert>

      {pipelines.size > 0 && (
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Title</TableHead>
              <TableHead>Modified at</TableHead>
              <TableHead>Last run</TableHead>
              <TableHead>Runs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from(pipelines.entries()).map(([name, fileEntry]) => (
              <PipelineRow
                key={fileEntry.componentRef.digest}
                componentRef={fileEntry.componentRef}
                name={name.replace(/_/g, " ")}
                modificationTime={fileEntry.modificationTime}
              />
            ))}
          </TableBody>
        </Table>
      )}

      <Button onClick={refreshAll} className="mt-6 max-w-96">
        Refresh
      </Button>
    </div>
  );
};
