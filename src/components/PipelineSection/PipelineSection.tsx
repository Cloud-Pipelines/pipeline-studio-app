import { Terminal } from "lucide-react";

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
import { type ComponentFileEntry } from "@/componentStore";

export type Pipelines = Map<string, ComponentFileEntry>;

interface PipelineSectionProps {
  pipelines: Pipelines;
  isLoading?: boolean;
}

export const PipelineSection = ({
  pipelines,
  isLoading,
}: PipelineSectionProps) => {
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
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
