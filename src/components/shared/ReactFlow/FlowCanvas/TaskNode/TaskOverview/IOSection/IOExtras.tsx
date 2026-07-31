import type { GetExecutionArtifactsResponse } from "@/api/types.gen";
import type { InputSpec, OutputSpec } from "@/utils/componentSpec";

import IOCell from "./IOCell/IOCell";
import IOCollapsibleSection from "./IOCollapsibleSection";

interface IOExtrasProps {
  inputs?: InputSpec[];
  outputs?: OutputSpec[];
  artifacts: GetExecutionArtifactsResponse;
}

const IOExtras = ({ inputs, outputs, artifacts }: IOExtrasProps) => {
  const additionalInputs = Object.entries(
    artifacts.input_artifacts || {},
  ).filter(([key]) => !inputs?.some((input) => input.name === key));

  const additionalOutputs = Object.entries(
    artifacts.output_artifacts || {},
  ).filter(([key]) => !outputs?.some((output) => output.name === key));

  if (!additionalInputs.length && !additionalOutputs.length) {
    return null;
  }

  return (
    <>
      {additionalInputs.length > 0 && (
        <IOCollapsibleSection
          title="Additional Input Artifacts"
          count={additionalInputs.length}
        >
          {additionalInputs.map(([key, artifact]) => (
            <IOCell key={key} name={key} artifact={artifact} />
          ))}
        </IOCollapsibleSection>
      )}

      {additionalOutputs.length > 0 && (
        <IOCollapsibleSection
          title="Additional Output Artifacts"
          count={additionalOutputs.length}
        >
          {additionalOutputs.map(([key, artifact]) => (
            <IOCell key={key} name={key} artifact={artifact} />
          ))}
        </IOCollapsibleSection>
      )}
    </>
  );
};

export default IOExtras;
