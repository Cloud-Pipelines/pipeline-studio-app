import { useCallback, useEffect, useState } from "react";

import { type OutputConnectedDetails } from "@/components/shared/ReactFlow/FlowCanvas/utils/getOutputConnectedDetails";
import { updateOutputNameOnComponentSpec } from "@/components/shared/ReactFlow/FlowCanvas/utils/updateOutputNameOnComponentSpec";
import { Button } from "@/components/ui/button";
import { useNodeSelectionTransfer } from "@/hooks/useNodeSelectionTransfer";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { type OutputSpec } from "@/utils/componentSpec";
import { outputNameToNodeId } from "@/utils/nodes/nodeIdUtils";

import {
  NameField,
  TypeField,
} from "../InputValueEditor/FormFields/FormFields";
import { checkNameCollision } from "../InputValueEditor/FormFields/utils";

interface OutputNameEditorProps {
  output: OutputSpec;
  onNameChange?: (oldName: string, newName: string) => void;
  onTypeChange?: (name: string, newType: string) => void;
  connectedDetails: OutputConnectedDetails;
  disabled?: boolean;
  onClose?: () => void;
}

export const OutputNameEditor = ({
  output,
  disabled,
  connectedDetails,
  onClose,
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

  const handleNameChange = (value: string) => {
    setOutputName(value);

    if (checkNameCollision(value, output.name, componentSpec, "outputs")) {
      setValidationError("An output with this name already exists");
      return;
    }

    setValidationError(null);
  };

  const handleClose = () => {
    saveChanges();
    onClose?.();
  };

  useEffect(() => {
    setOutputName(output.name);
  }, [output.name]);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold">{output.name}</h3>
        {output.description && (
          <p className="text-sm text-gray-500">{output.description}</p>
        )}
      </div>
      <div className="flex gap-4">
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
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
      </div>
    </div>
  );
};
