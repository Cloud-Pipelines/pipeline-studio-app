import { ChevronsUpDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { InputSpec, OutputSpec, TaskSpec } from "@/utils/componentSpec";
import { formatBytes, formatJsonValue } from "@/utils/string";
import { transformGcsUrl } from "@/utils/URL";

interface IoCellProps {
  io: InputSpec | OutputSpec;
  taskSpec: TaskSpec;
  artifacts: any;
}

const IoCell = ({ io, taskSpec, artifacts }: IoCellProps) => {
  const hasCollapsableContent =
    !!taskSpec.arguments?.[io.name] || !!io.description;

  return (
    <Collapsible key={io.name}>
      <div className="flex flex-col gap-3 py-3 border rounded-md relative z-10 bg-white">
        <div className="flex items-center justify-between px-3">
          <span className="font-medium text-sm">{io.name}</span>
          {io.type && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              {io.type?.toString()}{" "}
              <CollapsibleTrigger disabled={!hasCollapsableContent} className="cursor-pointer">
                <ChevronsUpDown
                  className={cn("w-4 h-4", { "hidden": !hasCollapsableContent })}
                />
              </CollapsibleTrigger>
            </span>
          )}
        </div>

        <CollapsibleContent className="flex flex-col gap-2">
          {io.description && (
            <div className="flex items-center px-3 py-0">
              <span className="font-medium text-xs min-w-24 max-w-24">
                Description:
              </span>
              <span className="font-medium text-xs text-gray-500">
                {io.description}
              </span>
            </div>
          )}

          {taskSpec.arguments?.[io.name] && (
            <div className="flex items-center px-3 py-0">
              <span className="font-medium text-xs min-w-24 max-w-24">
                Default
              </span>
              <span className="font-mono text-xs text-gray-500">
                {formatJsonValue(taskSpec.arguments?.[io.name])}
              </span>
            </div>
          )}
        </CollapsibleContent>
      </div>

      {artifacts?.artifact_data && (
        <div className="flex flex-col gap-3 py-3 border border-t-0 rounded-b-md bg-gray-50 z-0 -mt-2">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-medium text-sm">Artifact</span>
          </div>
          {artifacts.artifact_data.value !== undefined && (
            <div className="flex items-center px-3 py-0">
              <span className="font-medium text-xs min-w-24 max-w-24">
                Value
              </span>
              <span className="font-mono text-xs text-gray-500">
                {artifacts.artifact_data.value || "-"}
              </span>
            </div>
          )}

          {artifacts.artifact_data.uri !== undefined && (
            <div className="flex items-center px-3 py-0">
              <span className="font-medium text-xs min-w-24 max-w-24">
                URI:
              </span>
              <a
                href={transformGcsUrl(artifacts.artifact_data.uri)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono break-all text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                {artifacts.artifact_data.uri || "-"}
              </a>
            </div>
          )}

          {artifacts.artifact_data.total_size !== undefined && (
            <div className="flex items-center px-3 py-0">
              <span className="font-medium text-xs min-w-24 max-w-24">
                Size:
              </span>
              <span className="font-mono text-xs text-gray-500">
                {formatBytes(artifacts.artifact_data.total_size)}
              </span>
            </div>
          )}
        </div>
      )}
    </Collapsible>
  );
};

export default IoCell;
