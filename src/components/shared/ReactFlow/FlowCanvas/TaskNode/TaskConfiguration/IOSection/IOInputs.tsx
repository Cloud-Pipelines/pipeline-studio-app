import type { GetExecutionArtifactsResponse } from "@/api/types.gen";
import { BlockStack } from "@/components/ui/layout";
import { Heading, Paragraph } from "@/components/ui/typography";
import type { InputSpec } from "@/utils/componentSpec";

import IoCell from "./IOCell";

interface IOInputsProps {
  inputs?: InputSpec[];
  artifacts: GetExecutionArtifactsResponse;
}

const IOInputs = ({ inputs, artifacts }: IOInputsProps) => {
  return (
    <BlockStack gap="1" className="w-full">
      <Heading level={1}>Inputs</Heading>

      {(!inputs || inputs.length === 0) && (
        <Paragraph tone="subdued" size="xs">
          No inputs defined
        </Paragraph>
      )}

      {inputs?.map((input) => {
        const inputArtifact = artifacts.input_artifacts?.[input.name];

        return (
          <IoCell
            key={input.name}
            io={input}
            artifactData={inputArtifact?.artifact_data}
          />
        );
      })}
    </BlockStack>
  );
};

export default IOInputs;
