import { useNavigate } from "@tanstack/react-router";
import { List, Trash } from "lucide-react";
import { type MouseEvent, useCallback, useMemo } from "react";

import { ConfirmationDialog } from "@/components/shared/Dialogs";
import RunOverview from "@/components/shared/RunOverview";
import StatusIcon from "@/components/shared/Status/StatusIcon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableCell, TableRow } from "@/components/ui/table";
import useLoadPipelineRuns from "@/hooks/useLoadPipelineRuns";
import { useBackend } from "@/providers/BackendProvider";
import { EDITOR_PATH } from "@/routes/router";
import { deletePipeline } from "@/services/pipelineService";
import type { ComponentReferenceWithSpec } from "@/utils/componentStore";
import { convertUTCToLocalTime, formatDate } from "@/utils/date";

interface PipelineRowProps {
  url?: string;
  componentRef?: ComponentReferenceWithSpec;
  name?: string;
  modificationTime?: Date;
  onDelete?: () => void;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
}

const PipelineRow = ({
  name,
  modificationTime,
  onDelete,
  isSelected = false,
  onSelect,
}: PipelineRowProps) => {
  const { backendUrl } = useBackend();
  const navigate = useNavigate();

  const { pipelineRuns, latestRun } = useLoadPipelineRuns(
    name || "",
    backendUrl,
  );

  const handleRowClick = useCallback(
    (e: MouseEvent) => {
      // Don't navigate if clicking on the popover trigger
      if ((e.target as HTMLElement).closest("[data-popover-trigger]")) {
        return;
      }
      navigate({ to: `${EDITOR_PATH}/${name}` });
    },
    [navigate, name],
  );

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      onSelect?.(checked);
    },
    [onSelect],
  );

  const confirmPipelineDelete = useCallback(async () => {
    if (!name) return;

    const deleteCallback = () => {
      onDelete?.();
    };

    await deletePipeline(name, deleteCallback);
  }, [name]);

  const handleClick = useCallback((e: MouseEvent) => {
    // Prevent row click when clicking on the checkbox
    e.stopPropagation();
  }, []);

  const formattedDate = useMemo(() => {
    if (!modificationTime) return "N/A";
    return formatDate(modificationTime.toISOString());
  }, [modificationTime]);

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 group"
        onClick={handleRowClick}
      >
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox
            data-checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            onClick={handleClick}
          />
        </TableCell>
        <TableCell>
          <a href={`${EDITOR_PATH}/${name}`} className="hover:underline">
            {name}
          </a>
        </TableCell>
        <TableCell className="text-muted-foreground text-xs">
          {formattedDate}
        </TableCell>
        <TableCell className="text-muted-foreground text-xs">
          {latestRun ? (
            <div className="flex items-center gap-2">
              <StatusIcon status={latestRun.status} />
              <span>
                {formatDate(
                  convertUTCToLocalTime(latestRun.created_at).toISOString(),
                )}
              </span>
            </div>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell>
          {pipelineRuns.length > 0 && (
            <Popover>
              <PopoverTrigger
                data-popover-trigger
                className="cursor-pointer text-gray-500 border border-gray-200 rounded-md p-1 hover:bg-gray-200"
              >
                <List className="w-4 h-4" />
              </PopoverTrigger>
              <PopoverContent className="w-[500px]">
                <div className="text-sm mb-2">
                  <span className="font-bold">
                    {pipelineRuns[0].pipeline_name}
                  </span>{" "}
                  - {pipelineRuns.length} runs
                </div>
                <ScrollArea className="h-[300px]">
                  {pipelineRuns.map((run) => (
                    <RunOverview key={run.id} run={run} />
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}
        </TableCell>
        <TableCell className="w-0">
          <ConfirmationDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 cursor-pointer text-destructive-foreground hover:text-destructive-foreground"
              >
                <Trash className="h-4 w-4" />
              </Button>
            }
            title={`Delete pipeline "${name}"?`}
            description="Are you sure you want to delete this pipeline? Existing pipeline runs will not be impacted. This action cannot be undone."
            onConfirm={confirmPipelineDelete}
          />
        </TableCell>
      </TableRow>
    </>
  );
};

export default PipelineRow;
