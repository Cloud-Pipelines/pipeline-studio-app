import { useCallback, useEffect, useState } from "react";

import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Heading, Paragraph } from "@/components/ui/typography";
import { useNodeSelectionTransfer } from "@/hooks/useNodeSelectionTransfer";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { type OutputSpec } from "@/utils/componentSpec";
import { outputNameToNodeId } from "@/utils/nodes/nodeIdUtils";

import { type OutputConnectedDetails } from "../../utils/getOutputConnectedDetails";
import { updateOutputNameOnComponentSpec } from "../../utils/updateOutputNameOnComponentSpec";
import { NameField, TypeField } from "../InputValueEditor/FormFields";
import { checkNameCollision } from "../InputValueEditor/FormFields/utils";

interface OutputNameEditorProps {
  output: OutputSpec;
  disabled?: boolean;
  connectedDetails: OutputConnectedDetails;
}

export const OutputNameEditor = ({
  output,
  disabled,
  connectedDetails,
}: OutputNameEditorProps) => {
  const { transferSelection } = useNodeSelectionTransfer(outputNameToNodeId);
  const { setComponentSpec, componentSpec } = useComponentSpec();

  const [outputName, setOutputName] = useState(output.name);
  const [validationError, setValidationError] = useState<string | null>(null);

  const hasChanges = useCallback(() => {
    return outputName !== output.name;
  }, [outputName, output.name]);

  const handleOutputNameChange = useCallback(
    (oldName: string, newName: string) => {
      if (!componentSpec.outputs) return null;

      const updatedComponentSpec = updateOutputNameOnComponentSpec(
        componentSpec,
        oldName,
        newName,
      );

      transferSelection(oldName, newName);

      return updatedComponentSpec;
    },
    [componentSpec, setComponentSpec],
  );

  const saveChanges = useCallback(() => {
    if (!hasChanges() || validationError) return;

    const updatedComponentSpecWithValues = handleOutputNameChange(
      output.name,
      outputName,
    );

    if (updatedComponentSpecWithValues) {
      setComponentSpec(updatedComponentSpecWithValues);
    }
  }, [
    hasChanges,
    validationError,
    handleOutputNameChange,
    output.name,
    outputName,
    setComponentSpec,
  ]);

  const handleBlur = useCallback(() => {
    saveChanges();
  }, [saveChanges]);

  const handleNameChange = useCallback(
    (value: string) => {
      setOutputName(value);

      if (checkNameCollision(value, output.name, componentSpec, "outputs")) {
        setValidationError("An output with this name already exists");
        return;
      }

      setValidationError(null);
    },
    [componentSpec, output.name],
  );

  useEffect(() => {
    setOutputName(output.name);
  }, [output.name]);

  return (
    <BlockStack gap="3" className="p-4 w-full">
      <BlockStack gap="3">
        <Heading level={1}>{output.name}</Heading>
        {!!output.description && (
          <Paragraph size="sm" tone="subdued">
            {output.description}
          </Paragraph>
        )}
      </BlockStack>
      <InlineStack gap="4" className="w-full">
        <div className="flex-1">
          <NameField
            inputName={outputName}
            onNameChange={handleNameChange}
            onBlur={handleBlur}
            disabled={disabled}
            error={validationError}
          />
        </div>
        <div className="w-36">
          <TypeField
            inputValue={connectedDetails.outputType ?? "Any"}
            onInputChange={() => {}}
            placeholder="Any"
            disabled
            inputName={output.name}
          />
        </div>
      </InlineStack>
    </BlockStack>
  );
};
