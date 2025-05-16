import { ChevronsUpDown } from "lucide-react";
import { Code2, FileQuestion, Hash, Text } from "lucide-react";
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from "@/components/ui/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { InputSpec, OutputSpec } from "@/utils/componentSpec";
import { formatBytes } from "@/utils/string";
import { transformGcsUrl } from "@/utils/URL";

interface IoCellProps {
  io: InputSpec | OutputSpec;
  artifacts: any;
}

const typeIconMap: Record<string, React.ReactNode> = {
  string: <Text className="w-4 h-4" />,
  number: <Hash className="w-4 h-4" />,
  json: <Code2 className="w-4 h-4" />,
  jsonobject: <Code2 className="w-4 h-4" />,
  jsonarray: <Code2 className="w-4 h-4" />,
};

function getTypeIcon(type: string) {
  if (!type) return <FileQuestion className="w-4 h-4" />;
  const key = type.toLowerCase();
  return typeIconMap[key] || <FileQuestion className="w-4 h-4" />;
}

const IoCell = ({ io, artifacts }: IoCellProps) => {
  const hasCollapsableContent = artifacts?.artifact_data;

  return (
    <Collapsible key={io.name}>
      <div className="flex flex-col gap-3 py-3 border rounded-md relative z-10 bg-white">
        <div className="flex justify-between px-3">
          <span className="font-medium text-sm">{io.name}</span>
          {io.type && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              {artifacts?.artifact_data && (
                <span className="font-mono text-[10px] text-gray-500">
                  {formatBytes(artifacts.artifact_data.total_size)} &bull;
                </span>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{getTypeIcon(io.type?.toString())}</span> &bull;
                  </TooltipTrigger>
                  <TooltipContent>{io.type?.toString()}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <CollapsibleTrigger
                disabled={!hasCollapsableContent}
                className="cursor-pointer"
              >
                <ChevronsUpDown
                  className={cn("w-4 h-4 cursor-pointer", {
                    hidden: !hasCollapsableContent,
                  })}
                />
              </CollapsibleTrigger>
            </span>
          )}
        </div>
      </div>

      <CollapsibleContent className="flex flex-col gap-2">
        {artifacts?.artifact_data && (
          <div className="flex flex-col gap-3 pb-3 pt-5 border border-t-0 rounded-b-md bg-gray-50 z-0 -mt-2">
            {artifacts.artifact_data.value !== undefined && (
              <div className="flex px-3 py-0">
                <span className="flex-1">
                  <SyntaxHighlighter
                    language="json"
                    wrapLongLines
                    customStyle={{
                      background: "transparent",
                      margin: 0,
                      padding: 0,
                      wordBreak: "break-all",
                      whiteSpace: "pre-wrap",
                      fontFamily: "monospace",
                      fontSize: "10px",
                    }}
                    className="overflow-auto max-h-[300px] rounded bg-gray-100 max-w-full font-mono!"
                  >
                    {(() => {
                      const { value } = artifacts.artifact_data;
                      if (typeof value === "string") {
                        try {
                          return JSON.stringify(JSON.parse(value), null, 2);
                        } catch {
                          return value; // fallback: show as-is if not valid JSON
                        }
                      }
                      return JSON.stringify(value, null, 2);
                    })()}
                  </SyntaxHighlighter>
                </span>
              </div>
            )}

            {artifacts.artifact_data.uri !== undefined && (
              <div className="flex  px-3 py-0">
                <span className="font-medium text-xs min-w-24 max-w-24">
                  URI:
                </span>
                <Link
                  external
                  href={transformGcsUrl(artifacts.artifact_data.uri)}
                  className="font-mono break-all text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  Download Artifact
                </Link>
              </div>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default IoCell;
