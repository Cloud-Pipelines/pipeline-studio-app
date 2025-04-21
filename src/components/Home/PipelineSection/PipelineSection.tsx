import { CircleX, Terminal } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";

import { NewExperimentDialog } from "@/components/shared/Dialogs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  type ComponentFileEntry,
  getAllComponentFilesFromList,
} from "@/utils/componentStore";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";

import PipelineRow from "./PipelineRow";

export type Pipelines = Map<string, ComponentFileEntry>;

export const PipelineSection = () => {
  const [pipelines, setPipelines] = useState<Pipelines>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
          return (
            new Date(b[1].modificationTime).getTime() -
            new Date(a[1].modificationTime).getTime()
          );
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

  const filteredPipelines = Array.from(pipelines.entries()).filter(([name]) => {
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

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

      <div className="py-4 w-[256px]">
        <Label className="mb-2">Search pipelines</Label>
        <div className="flex gap-1">
          <Input type="text" value={searchQuery} onChange={handleSearch} />
          <Button
            variant="ghost"
            className={cn(searchQuery ? "" : "invisible")}
            onClick={() => setSearchQuery("")}
          >
            <CircleX />
          </Button>
        </div>
      </div>

      {pipelines.size > 0 && (
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Title</TableHead>
              <TableHead>Modified at</TableHead>
              <TableHead>Last run</TableHead>
              <TableHead>Runs</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPipelines.length === 0 && (
              <TableRow>No Pipelines found.</TableRow>
            )}
            {filteredPipelines.map(([name, fileEntry]) => (
              <PipelineRow
                key={fileEntry.componentRef.digest}
                name={name.replace(/_/g, " ")}
                modificationTime={fileEntry.modificationTime}
                onDelete={fetchUserPipelines}
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
