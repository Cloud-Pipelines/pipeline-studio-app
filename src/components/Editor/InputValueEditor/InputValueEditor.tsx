import { useMemo, useState } from "react";

import { updateInputNameOnComponentSpec } from "@/components/shared/ReactFlow/FlowCanvas/utils/updateInputNameOnComponentSpec";
import { Button } from "@/components/ui/button";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { type InputSpec } from "@/utils/componentSpec";
import { checkInputConnectionToRequiredFields } from "@/utils/inputConnectionUtils";

import { checkNameCollision } from "./FormFields";
import {
  NameField,
  OptionalField,
  TextField,
  TypeField,
} from "./FormFields/FormFields";

interface InputValueEditorProps {
  input: InputSpec;
  onSave?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const InputValueEditor = ({
  input,
  onSave,
  onCancel,
  disabled = false,
}: InputValueEditorProps) => {
  const [inputValue, setInputValue] = useState(input.value || "");
  const [inputName, setInputName] = useState(input.name);
  const [inputType, setInputType] = useState(input.type?.toString() || "any");
  const [inputOptional, setInputOptional] = useState(input.optional ?? true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { componentSpec, setComponentSpec } = useComponentSpec();

  // Check if this input is connected to any required fields
  const { isConnectedToRequired, connectedFields } = useMemo(() => {
    return checkInputConnectionToRequiredFields(input.name, componentSpec);
  }, [input.name, componentSpec]);

  // If connected to required fields, force optional to false and disable the field
  const isOptionalDisabled = isConnectedToRequired || disabled;
  const effectiveOptionalValue = isConnectedToRequired ? false : inputOptional;

  const handleInputChange = (
    oldName: string,
    value: string,
    newName: string,
    optional: boolean,
    type: string,
  ) => {
    if (!componentSpec.inputs) return;

    const updatedInputs = componentSpec.inputs.map((componentInput) => {
      if (componentInput.name === oldName) {
        return {
          ...componentInput,
          value,
          default: value,
          name: newName,
          optional,
          type,
        };
      }
      return componentInput;
    });

    const updatedComponentSpecValues = {
      ...componentSpec,
      inputs: updatedInputs,
    };

    return updateInputNameOnComponentSpec(
      updatedComponentSpecValues,
      oldName,
      newName,
    );
  };

  const handleValueChange = (value: string) => {
    setInputValue(value);
  };

  const handleOptionalChange = (checked: boolean) => {
    if (isConnectedToRequired) {
      return;
    }
    setInputOptional(checked);
  };

  const handleTypeChange = (value: string) => {
    setInputType(value);
  };

  const handleNameChange = (newName: string) => {
    setInputName(newName);

    if (checkNameCollision(newName, input.name, componentSpec, "inputs")) {
      setValidationError("An input with this name already exists");
      return;
    }

    setValidationError(null);
  };
  const handleSave = () => {
    const updatedComponentSpecWithValues = handleInputChange(
      input.name,
      inputValue,
      inputName,
      effectiveOptionalValue,
      inputType as string,
    );

    if (updatedComponentSpecWithValues) {
      setComponentSpec(updatedComponentSpecWithValues);
    }
    onSave?.();
  };

  const placeholder = input.default || `Enter ${input.name}...`;

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold">{input.name}</h3>
        <p className="text-sm text-gray-500">{input.description}</p>
      </div>
      <NameField
        inputName={inputName}
        onNameChange={handleNameChange}
        error={validationError}
        disabled={disabled}
      />

      <TextField
        inputValue={inputValue}
        onInputChange={handleValueChange}
        placeholder={placeholder}
        disabled={disabled}
        inputName={input.name}
      />

      <TypeField
        inputValue={inputType}
        onInputChange={handleTypeChange}
        placeholder="Type: Any"
        disabled={disabled}
        inputName={input.name}
      />

      <OptionalField
        inputName={input.name}
        onInputChange={handleOptionalChange}
        inputValue={effectiveOptionalValue}
        disabled={isOptionalDisabled}
      />
      {isConnectedToRequired && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          This input is connected to required fields:{" "}
          {connectedFields.join(", ")}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!!validationError || disabled}>
          Save
        </Button>
      </div>
    </div>
  );
};
