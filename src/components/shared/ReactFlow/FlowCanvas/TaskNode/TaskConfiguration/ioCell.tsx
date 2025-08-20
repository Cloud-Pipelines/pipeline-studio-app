import { ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CodeViewer } from "@/components/shared/CodeViewer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from "@/components/ui/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  InputSpec,
  OutputSpec,
  TypeSpecType,
} from "@/utils/componentSpec";
import { copyToClipboard, formatBytes } from "@/utils/string";
import { convertGcsUrlToBrowserUrl } from "@/utils/URL";

const MAX_LINES = 10;
const JSON_CODE_LINE_HEIGHT = 31;
const HEADER_HEIGHT = 55;

interface IoCellProps {
  io: InputSpec | OutputSpec;
  artifacts: any;
}

const canShowInlineValue = (value: any, type: TypeSpecType | undefined) => {
  if (!type || !value) {
    return false;
  }
  if (type === "Integer" || type === "Boolean") {
    return true;
  }
  if (type === "String" && value.length < 31) {
    return true;
  }
  return false;
};
const IoCell = ({ io, artifacts }: IoCellProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [copyType, setCopyType] = useState<"Name" | "Value">();
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCollapsableContent =
    artifacts?.artifact_data &&
    !canShowInlineValue(artifacts?.artifact_data?.value, io.type);

  const handleTooltipOpen = (open: boolean) => {
    // When the tooltip is closed, we need to clear the copied state
    if (!open) {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      setIsCopied(false);
    }
    setIsTooltipOpen(open);
  };
  const handleCopy = (value: string) => {
    copyToClipboard(value);
    setIsCopied(true);
    setIsTooltipOpen(true);

    // Clear any existing timer
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);

    tooltipTimerRef.current = setTimeout(() => {
      setIsTooltipOpen(false);
      setCopyType(undefined);
    }, 1500);
  };

  const handleCopyName = () => {
    handleCopy(io.name);
    setCopyType("Name");
  };

  const handleCopyValue = () => {
    handleCopy(artifacts?.artifact_data?.value);
    setCopyType("Value");
  };

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  return (
    <Collapsible key={io.name}>
      <div className="flex flex-col gap-3 py-3 border rounded-md relative z-10 bg-white">
        <div className="flex justify-between px-3 gap-2">
          <div className="flex-1 min-w-auto flex-shrink-0">
            <Tooltip
              delayDuration={300}
              open={isTooltipOpen}
              onOpenChange={handleTooltipOpen}
            >
              <TooltipTrigger className="text-left">
                <span
                  className="font-medium text-sm cursor-copy break-all hover:text-gray-500"
                  onClick={handleCopyName}
                >
                  {io.name}
                </span>
              </TooltipTrigger>
              <TooltipContent
                arrowClassName={cn(
                  isCopied && "bg-emerald-200 fill-emerald-200",
                )}
                className={cn(isCopied && "bg-emerald-200 text-emerald-800")}
              >
                {isCopied ? `${copyType} copied` : `Copy`}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex-none flex gap-2">
            {artifacts?.artifact_data && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                {artifacts?.artifact_data?.uri !== undefined && (
                  <>
                    <Link
                      href={convertGcsUrlToBrowserUrl(
                        artifacts?.artifact_data?.uri || "",
                        artifacts?.artifact_data?.is_dir || false,
                      )}
                      external
                      iconClassName="h-2.5 w-2.5"
                      className="font-mono break-all text-[10px] text-blue-600 hover:text-blue-800 hover:underline flex gap-1"
                    >
                      Link
                    </Link>
                    &bull;
                  </>
                )}
                {artifacts?.artifact_data && (
                  <>
                    {artifacts.artifact_data.value !== undefined &&
                      canShowInlineValue(
                        artifacts.artifact_data.value,
                        io.type,
                      ) && (
                        <>
                          <span className="font-mono text-[10px] text-amber-500">
                            {artifacts.artifact_data.value}
                          </span>
                          &bull;
                        </>
                      )}

                    <span className="font-mono text-[10px] text-gray-500">
                      {formatBytes(artifacts.artifact_data.total_size)} &bull;
                    </span>
                  </>
                )}

                {io.type?.toString()}
                <CollapsibleTrigger
                  disabled={!hasCollapsableContent}
                  className={cn({
                    hidden: !hasCollapsableContent,
                  })}
                >
                  <ChevronsUpDown className="w-4 h-4 cursor-pointer" />
                </CollapsibleTrigger>
              </span>
            )}
          </div>
        </div>
      </div>

      <CollapsibleContent className="flex flex-col gap-2">
        {artifacts?.artifact_data && (
          <div className="flex flex-col gap-3 pb-3 pt-5 border border-t-0 rounded-b-md bg-gray-50 z-0 -mt-2">
            {artifacts.artifact_data.value !== undefined && (
              <div className="flex px-3 py-0 w-full">
                <span
                  className="flex-1 w-full cursor-copy overflow-hidden"
                  onClick={handleCopyValue}
                >
                  {(() => {
                    const { value } = artifacts.artifact_data;
                    let parsed;
                    if (typeof value === "string") {
                      try {
                        parsed = JSON.parse(value);
                      } catch {
                        // Not JSON, treat as plain string
                        return (
                          <pre className="w-full font-mono text-xs whitespace-pre-line break-words">
                            {value}
                          </pre>
                        );
                      }
                    } else {
                      parsed = value;
                    }

                    const codeString = JSON.stringify(parsed, null, 2);

                    const lines = codeString.split("\n");
                    const maxLines = Math.min(MAX_LINES, lines.length);
                    const lineHeight = `${maxLines * JSON_CODE_LINE_HEIGHT + HEADER_HEIGHT}px`;

                    return (
                      <div style={{ height: lineHeight }}>
                        <CodeViewer
                          code={codeString}
                          language="json"
                          filename={io.name}
                        />
                      </div>
                    );
                  })()}
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
                  href={convertGcsUrlToBrowserUrl(
                    artifacts.artifact_data.uri,
                    artifacts.artifact_data.is_dir,
                  )}
                  className="font-mono break-all text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  {artifacts.artifact_data.uri}
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
