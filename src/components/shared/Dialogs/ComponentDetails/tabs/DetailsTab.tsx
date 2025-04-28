import { Download, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ComponentSpec } from "@/utils/componentSpec";
import { convertRawUrlToDirectoryUrl } from "@/utils/URL";

interface DetailsTabProps {
  displayName: string;
  componentSpec: ComponentSpec;
  componentDigest: string;
  url: string;
  actions?: React.ReactNode[];
  handleDownloadYaml: () => void;
}

const DetailsTab = ({
  displayName,
  componentSpec,
  componentDigest,
  url,
  actions = [],
  handleDownloadYaml,
}: DetailsTabProps) => {
  const canonicalUrl = componentSpec?.metadata?.annotations?.canonical_location;

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
            <div className="flex-shrink-0 font-medium text-sm text-gray-700 mb-1">
              Description
            </div>
            <div className="text-xs text-gray-600 break-words whitespace-pre-wrap">
              {componentSpec.description}
            </div>
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

        <div className="flex flex-row gap-2 px-3 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadYaml}
            className="flex items-center gap-1 cursor-pointer"
          >
            <Download className="size-4" />
            Download YAML
          </Button>
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex-shrink-0 font-medium text-sm text-gray-700 mb-1"
            >
              {action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailsTab;
