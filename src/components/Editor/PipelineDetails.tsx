import { Frown, Network } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import type { ComponentSpec } from "@/utils/componentSpec";

import RenamePipeline from "./RenamePipeline";

type PipelineDetailsProps = {
  componentSpec: ComponentSpec;
  isLoading?: boolean;
};

export const PipelineDetails = ({
  componentSpec,
  isLoading,
}: PipelineDetailsProps) => {
  if (!componentSpec) {
    <div className="flex flex-col gap-8 items-center justify-center h-full">
      <Frown className="w-12 h-12 text-gray-500" />
      <div className="text-gray-500">Error loading pipeline details.</div>
    </div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="mr-2" />
        <p className="text-gray-500">Loading pipeline details...</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="flex items-center gap-2 mb-8">
        <Network className="w-6 h-6 text-gray-500 rotate-270" />
        <h2 className="text-lg font-semibold">
          {componentSpec.name ?? "Unnamed Pipeline"}
        </h2>
        <RenamePipeline componentSpec={componentSpec} />
      </div>
      <div className="flex flex-col gap-4 px-2">
        {componentSpec.description && (
          <div>
            <h3 className="text-md font-medium mb-1">Description</h3>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {componentSpec.description}
            </div>
          </div>
        )}
        <div>
          <h3 className="text-md font-medium mb-1">Inputs</h3>
          {componentSpec.inputs && componentSpec.inputs.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-gray-800">
              {componentSpec.inputs.map((input) => (
                <li key={input.name}>
                  <span className="font-semibold">{input.name}</span>
                  {input.type && (
                    <span className="ml-2 text-gray-500">
                      ({typeof input.type === "string" ? input.type : "object"})
                    </span>
                  )}
                  {input.description && (
                    <div className="text-xs text-gray-500 ml-4">
                      {input.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-gray-400">No inputs</div>
          )}
        </div>
        <div>
          <h3 className="text-md font-medium mb-1">Outputs</h3>
          {componentSpec.outputs && componentSpec.outputs.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-gray-800">
              {componentSpec.outputs.map((output) => (
                <li key={output.name}>
                  <span className="font-semibold">{output.name}</span>
                  {output.type && (
                    <span className="ml-2 text-gray-500">
                      (
                      {typeof output.type === "string" ? output.type : "object"}
                      )
                    </span>
                  )}
                  {output.description && (
                    <div className="text-xs text-gray-500 ml-4">
                      {output.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-gray-400">No outputs</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineDetails;
