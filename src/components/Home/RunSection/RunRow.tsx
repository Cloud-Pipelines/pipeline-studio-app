import { Link, useNavigate } from "@tanstack/react-router";
import { type MouseEvent, useCallback } from "react";

import type { PipelineRunResponse } from "@/api/types.gen";
import { StatusBar, StatusIcon, StatusText } from "@/components/shared/Status";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useToastNotification from "@/hooks/useToastNotification";
import { useBackend } from "@/providers/BackendProvider";
import { APP_ROUTES } from "@/routes/router";
import {
  countTaskStatuses,
  getRunStatus,
  useFetchExecutionInfo,
} from "@/services/executionService";
import { convertUTCToLocalTime, formatDate } from "@/utils/date";

const RunRow = ({ run }: { run: PipelineRunResponse }) => {
  const navigate = useNavigate();
  const notify = useToastNotification();
  const { backendUrl } = useBackend();

  const executionId = `${run.root_execution_id}`;

  const { data, isLoading, error } = useFetchExecutionInfo(
    executionId,
    backendUrl,
    false,
  );
  const { details, state } = data;

  const name = details?.task_spec?.componentRef?.spec?.name;

  const createdBy = run.created_by ?? "Unknown user";
  const truncatedCreatedBy = truncateMiddle(createdBy);
  const isTruncated = createdBy !== truncatedCreatedBy;

  const handleCopy = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(createdBy);
      notify(`"${createdBy}" copied to clipboard`, "success");
    },
    [createdBy],
  );

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={4}>Loading...</TableCell>
      </TableRow>
    );
  }

  if (error || !details || !state) {
    return (
      <TableRow>
        <TableCell
          colSpan={4}
          className="flex flex-col p-2 text-sm text-red-500"
        >
          <span>Error loading run details</span>
          <span className="text-xs">{error?.message}</span>
        </TableCell>
      </TableRow>
    );
  }

  const statusCounts = countTaskStatuses(details, state);

  const clickThroughUrl = `${APP_ROUTES.RUNS}/${executionId}`;

  const LinkProps = {
    to: clickThroughUrl,
    className: "underline hover:text-blue-500 text-black",
    onClick: (e: MouseEvent) => {
      e.stopPropagation(); // Prevent triggering the row click handler
    },
  };

  const createdByButton = (
    <Button
      className="truncate underline"
      onClick={handleCopy}
      tabIndex={0}
      variant="ghost"
    >
      {truncatedCreatedBy}
    </Button>
  );

  const createdByButtonWithTooltip = (
    <Tooltip>
      <TooltipTrigger asChild>{createdByButton}</TooltipTrigger>
      <TooltipContent>
        <span>{createdBy}</span>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TableRow
      onClick={(e) => {
        e.stopPropagation();
        navigate({ to: clickThroughUrl });
      }}
      className="cursor-pointer text-gray-500 text-xs"
    >
      <TableCell className="text-sm flex items-center gap-2">
        <StatusIcon status={getRunStatus(statusCounts)} />
        <Link {...LinkProps}>{name}</Link>
        <span>{`#${executionId}`}</span>
      </TableCell>
      <TableCell>
        <HoverCard openDelay={100}>
          <HoverCardTrigger>
            <div className="w-2/3">
              <StatusBar statusCounts={statusCounts} />
            </div>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-bold">Status</div>
              <StatusText statusCounts={statusCounts} />
            </div>
          </HoverCardContent>
        </HoverCard>
      </TableCell>
      <TableCell>
        {run.created_at
          ? `${formatDate(convertUTCToLocalTime(run.created_at).toISOString())}`
          : "Data not found..."}
      </TableCell>
      <TableCell>
        {isTruncated ? createdByButtonWithTooltip : createdByButton}
      </TableCell>
    </TableRow>
  );
};

export default RunRow;

function truncateMiddle(str: string, maxLength = 28) {
  if (!str || str.length <= maxLength) return str;
  const keep = Math.floor((maxLength - 3) / 2);
  return str.slice(0, keep) + "..." + str.slice(-keep);
}
