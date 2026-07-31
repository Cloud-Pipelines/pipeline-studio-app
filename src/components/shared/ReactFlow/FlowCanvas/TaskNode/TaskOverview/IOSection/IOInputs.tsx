import type { GetExecutionArtifactsResponse } from "@/api/types.gen";
import { Paragraph } from "@/components/ui/typography";
import type { InputSpec } from "@/utils/componentSpec";

import IOCell from "./IOCell/IOCell";
import IOCollapsibleSection from "./IOCollapsibleSection";

interface IOInputsProps {
  inputs?: InputSpec[];
  artifacts: GetExecutionArtifactsResponse;
}

const IOInputs = ({ inputs, artifacts }: IOInputsProps) => {
  return (
    <IOCollapsibleSection title="Inputs" count={inputs?.length ?? 0}>
      {(!inputs || inputs.length === 0) && (
        <Paragraph tone="subdued" size="xs">
          No inputs defined
        </Paragraph>
      )}

      {inputs?.map((input) => {
        const inputArtifact = artifacts.input_artifacts?.[input.name];

        return (
          <IOCell
            key={input.name}
            name={input.name}
            type={input.type?.toString()}
            artifact={inputArtifact}
          />
        );
      })}
    </IOCollapsibleSection>
  );
};

export default IOInputs;
