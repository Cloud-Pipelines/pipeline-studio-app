import { Frown, Network } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import useToastNotification from "@/hooks/useToastNotification";
import type { ComponentSpec } from "@/utils/componentSpec";
import { getComponentFileFromList } from "@/utils/componentStore";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";

import { TaskImplementation } from "../shared/TaskDetails";
import RecentExecutions from "./components/RecentExecutions";
import RenamePipeline from "./RenamePipeline";

type PipelineDetailsProps = {
  componentSpec: ComponentSpec;
  isLoading?: boolean;
};

const PipelineDetails = ({
  componentSpec,
  isLoading,
}: PipelineDetailsProps) => {
  const notify = useToastNotification();

  // State for file metadata
  const [fileMeta, setFileMeta] = useState<{
    creationTime?: Date;
    modificationTime?: Date;
    createdBy?: string;
    digest?: string;
  }>({});

  // Fetch file metadata on mount or when componentSpec.name changes
  useEffect(() => {
    const fetchMeta = async () => {
      if (!componentSpec?.name) return;
      const file = await getComponentFileFromList(
        USER_PIPELINES_LIST_NAME,
        componentSpec.name,
      );
      if (file) {
        setFileMeta({
          creationTime: file.creationTime,
          modificationTime: file.modificationTime,
          createdBy: file.componentRef.spec.metadata?.annotations?.author as
            | string
            | undefined,
          digest: file.componentRef.digest,
        });
      }
    };
    fetchMeta();
  }, [componentSpec?.name]);

  if (!componentSpec) {
    return (
      <div className="flex flex-col gap-8 items-center justify-center h-full">
        <Frown className="w-12 h-12 text-secondary-foreground" />
        <div className="text-secondary-foreground">
          Error loading pipeline details.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="mr-2" />
        <p className="text-secondary-foreground">Loading pipeline details...</p>
      </div>
    );
  }

  // Helper for annotations
  const annotations = componentSpec.metadata?.annotations || {};

  return (
    <div className="p-2 flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 max-w-[90%]">
        <Network className="w-6 h-6 text-secondary-foreground rotate-270 min-w-6 min-h-6" />
        <h2 className="text-lg font-semibold">
          {componentSpec.name ?? "Unnamed Pipeline"}
        </h2>
        <RenamePipeline componentSpec={componentSpec} />
      </div>

      {/* General Metadata */}
      <div className="flex flex-col gap-2 text-xs text-secondary-foreground mb-2">
        <div className="flex flex-wrap gap-6">
          {fileMeta.createdBy && (
            <div>
              <span className="font-semibold">Created by:</span>{" "}
              {fileMeta.createdBy}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-6">
          {fileMeta.creationTime && (
            <div>
              <span className="font-semibold">Created at:</span>{" "}
              {new Date(fileMeta.creationTime).toLocaleString()}
            </div>
          )}
          {fileMeta.modificationTime && (
            <div>
              <span className="font-semibold">Last updated:</span>{" "}
              {new Date(fileMeta.modificationTime).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {componentSpec.description && (
        <div>
          <h3 className="text-md font-medium mb-1">Description</h3>
          <div className="text-sm whitespace-pre-line">
            {componentSpec.description}
          </div>
        </div>
      )}

      {/* Component Digest */}
      {fileMeta.digest && (
        <div className="mb-2">
          <h3 className="text-md font-medium mb-1">Digest</h3>
          <Button
            className="bg-gray-100 border border-gray-300 rounded p-2 h-fit text-xs w-full text-left hover:bg-gray-200 active:bg-gray-300 transition cursor-pointer"
            onClick={() => {
              if (fileMeta.digest) {
                navigator.clipboard.writeText(fileMeta.digest);
                notify("Digest copied to clipboard", "success");
              }
            }}
            variant="ghost"
          >
            <span className="font-mono break-all w-full text-wrap">
              {fileMeta.digest}
            </span>
          </Button>
        </div>
      )}

      {/* Annotations */}
      {Object.keys(annotations).length > 0 && (
        <div>
          <h3 className="text-md font-medium mb-1">Annotations</h3>
          <ul className="text-xs text-secondary-foreground">
            {Object.entries(annotations).map(([key, value]) => (
              <li key={key}>
                <span className="font-semibold">{key}:</span>{" "}
                <span className="break-all">{String(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Artifacts (Inputs & Outputs) */}
      <div>
        <h3 className="text-md font-medium mb-1">Artifacts</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1">Inputs</h4>
            {componentSpec.inputs && componentSpec.inputs.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-secondary-foreground">
                {componentSpec.inputs.map((input) => (
                  <li key={input.name}>
                    <span className="font-semibold">{input.name}</span>
                    {input.type && (
                      <span className="ml-2 text-muted-foreground">
                        (
                        {typeof input.type === "string" ? input.type : "object"}
                        )
                      </span>
                    )}
                    {input.description && (
                      <div className="text-xs text-secondary-foreground ml-4">
                        {input.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-muted-foreground">No inputs</div>
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1">Outputs</h4>
            {componentSpec.outputs && componentSpec.outputs.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-secondary-foreground">
                {componentSpec.outputs.map((output) => (
                  <li key={output.name}>
                    <span className="font-semibold">{output.name}</span>
                    {output.type && (
                      <span className="ml-2 text-muted-foreground">
                        (
                        {typeof output.type === "string"
                          ? output.type
                          : "object"}
                        )
                      </span>
                    )}
                    {output.description && (
                      <div className="text-xs text-secondary-foreground ml-4">
                        {output.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-muted-foreground">No outputs</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Executions */}
      <RecentExecutions />

      {/* Pipeline YAML */}
      <div className="flex flex-col h-full">
        <div className="font-medium text-md flex items-center gap-1 cursor-pointer">
          Pipeline YAML
        </div>
        <div className="mt-1 h-full min-h-0 flex-1">
          <TaskImplementation
            displayName={componentSpec.name ?? "Pipeline"}
            componentSpec={componentSpec}
          />
        </div>
      </div>
    </div>
  );
};

export default PipelineDetails;
