import type { GetExecutionArtifactsResponse } from "@/api/types.gen";
import { Paragraph } from "@/components/ui/typography";
import type { OutputSpec } from "@/utils/componentSpec";

import IOCell from "./IOCell/IOCell";
import IOCollapsibleSection from "./IOCollapsibleSection";

interface IOOutputsProps {
  outputs?: OutputSpec[];
  artifacts: GetExecutionArtifactsResponse;
}

const IOOutputs = ({ outputs, artifacts }: IOOutputsProps) => {
  return (
    <IOCollapsibleSection title="Outputs" count={outputs?.length ?? 0}>
      {(!outputs || outputs.length === 0) && (
        <Paragraph tone="subdued" size="xs">
          No outputs defined
        </Paragraph>
      )}

      {outputs?.map((output) => {
        const outputArtifact = artifacts?.output_artifacts?.[output.name];

        return (
          <IOCell
            key={output.name}
            name={output.name}
            type={output.type?.toString()}
            artifact={outputArtifact}
          />
        );
      })}
    </IOCollapsibleSection>
  );
};

export default IOOutputs;
