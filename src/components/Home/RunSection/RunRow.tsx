import { Link, useNavigate } from "@tanstack/react-router";
import { type MouseEvent } from "react";

import type { PipelineRunResponse } from "@/api/types.gen";
import { StatusBar, StatusIcon, StatusText } from "@/components/shared/Status";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { TableCell, TableRow } from "@/components/ui/table";
import { APP_ROUTES } from "@/routes/router";
import {
  countTaskStatuses,
  fetchExecutionInfo,
  getRunStatus,
} from "@/services/executionService";

import { formatDate } from "../utils";

const RunRow = ({ run }: { run: PipelineRunResponse }) => {
  const navigate = useNavigate();

  const executionId = `${run.root_execution_id}`;

  const { data, isLoading, error } = fetchExecutionInfo(executionId);
  const { details, state } = data;

  const name = details?.task_spec?.componentRef?.spec?.name;

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
        {run.created_at ? `${formatDate(run.created_at)}` : "Data not found..."}
      </TableCell>
      <TableCell>{run ? `${run.created_by ?? "Unknown user"}` : ""}</TableCell>
    </TableRow>
  );
};

export default RunRow;
