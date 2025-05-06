import {
  ChevronsUpDown,
  ClipboardIcon,
  DownloadIcon,
  ExternalLink,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useToastNotification from "@/hooks/useToastNotification";
import type { ComponentSpec } from "@/utils/componentSpec";
import {
  convertRawUrlToDirectoryUrl,
  downloadYamlFromComponentText,
} from "@/utils/URL";
import copyToYaml from "@/utils/yaml";

interface TaskDetailsProps {
  displayName: string;
  componentSpec: ComponentSpec;
  taskId?: string;
  componentDigest?: string;
  url?: string;
  actions?: ReactNode[];
}

const TaskDetails = ({
  displayName,
  componentSpec,
  taskId,
  componentDigest,
  url,
  actions = [],
}: TaskDetailsProps) => {
  const notify = useToastNotification();

  const canonicalUrl = componentSpec?.metadata?.annotations?.canonical_location;

  const handleDownloadYaml = () => {
    downloadYamlFromComponentText(componentSpec, displayName);
  };

  const handleCopyYaml = () => {
    copyToYaml(componentSpec,
      (message) => notify(message, "success"),
      (message) => notify(message, "error"),
    );
  };

  return (
    <div className="h-full overflow-auto hide-scrollbar">
      <div className="border rounded-md divide-y w-full">
        <div className="flex flex-col px-3 py-2">
          <div className="flex-shrink-0 font-medium text-sm text-gray-700 mb-1">
            Name
          </div>
          <div className="text-xs text-gray-600 break-words whitespace-pre-wrap">
            {componentSpec?.name || displayName}
          </div>
        </div>
        {taskId && (
          <div className="flex flex-col px-3 py-2">
            <div className="flex-shrink-0 font-medium text-sm text-gray-700 mb-1">
              Task ID
            </div>
            <div className="text-xs text-gray-600 break-words whitespace-pre-wrap">
              {taskId}
            </div>
          </div>
        )}

        {componentSpec?.metadata?.annotations?.author && (
          <div className="flex flex-col px-3 py-2">
            <div className="flex-shrink-0 font-medium text-sm text-gray-700 mb-1">
              Author
            </div>
            <div className="text-xs text-gray-600 break-words whitespace-pre-wrap">
              {componentSpec.metadata.annotations?.author}
            </div>
          </div>
        )}

        {(url || canonicalUrl) && (
          <div className="flex flex-col px-3 py-2">
            <div className="flex-shrink-0 font-medium text-sm text-gray-700 mb-1">
              URL
            </div>
            {url && (
              <>
                <div className="text-sm break-all">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-500 hover:underline flex items-center gap-1"
                  >
                    View raw component.yaml
                    <ExternalLink className="size-3 flex-shrink-0" />
                  </a>
                </div>
                <div className="text-sm break-all">
                  <a
                    href={convertRawUrlToDirectoryUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-500 hover:underline flex items-center gap-1"
                  >
                    View component.yaml on GitHub
                    <ExternalLink className="size-3 flex-shrink-0" />
                  </a>
                </div>
              </>
            )}
            {canonicalUrl && (
              <>
                <div className="text-sm break-all">
                  <a
                    href={canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-500 hover:underline flex items-center gap-1"
                  >
                    View raw canonical URL
                    <ExternalLink className="size-3 flex-shrink-0" />
                  </a>
                </div>
                <div className="text-sm break-all">
                  <a
                    href={convertRawUrlToDirectoryUrl(canonicalUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-500 hover:underline flex items-center gap-1"
                  >
                    View canonical URL on GitHub
                    <ExternalLink className="size-3 flex-shrink-0" />
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {componentSpec?.description && (
          <div className="flex flex-col px-3 py-2">
            <Collapsible>
              <div className="font-medium text-sm text-gray-700 flex items-center gap-1">
                Description
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronsUpDown className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="text-xs text-gray-600 break-words whitespace-pre-wrap">
                  {componentSpec.description}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {componentDigest && (
          <div className="flex flex-col px-3 py-2">
            <div className="flex-shrink-0 font-medium text-sm text-gray-700 mb-1">
              Digest
            </div>
            <div className="font-mono text-xs break-all">{componentDigest}</div>
          </div>
        )}

        <div className="px-3 py-2 flex flex-row gap-2" key={0}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={handleDownloadYaml}
                >
                  <DownloadIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download YAML</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={handleCopyYaml}
                >
                  <ClipboardIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy YAML</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {actions}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
