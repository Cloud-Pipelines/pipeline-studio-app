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
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
      setPipelines(pipelines);
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      <div className="py-4 w-[200px]">
        <Label className="mb-2">Search pipelines</Label>
        <Input type="text" value={searchQuery} onChange={handleSearch} />
      </div>

      {pipelines.size > 0 && (
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Title</TableHead>
              <TableHead>Last run</TableHead>
              <TableHead>Runs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPipelines.map(([name, fileEntry]) => (
              <PipelineRow
                key={fileEntry.componentRef.digest}
                componentRef={fileEntry.componentRef}
                name={name.replace(/_/g, " ")}
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
