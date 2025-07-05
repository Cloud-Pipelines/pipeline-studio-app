import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { type InputSpec, renameInput } from "@/utils/componentSpec";

import { NameField, OptionalField, TextField, TypeField } from "./FormFields";

interface InputValueEditorProps {
  input: InputSpec;
  onSave?: () => void;
  disabled?: boolean;
}

export const InputValueEditor = ({
  input,
  onSave,
  disabled = false,
}: InputValueEditorProps) => {
  const [inputValue, setInputValue] = useState(input.value || "");
  const [inputName, setInputName] = useState(input.name);
  const [inputType, setInputType] = useState(input.type?.toString() || "any");
  const [inputOptional, setInputOptional] = useState(input.optional ?? false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { componentSpec, setComponentSpec } = useComponentSpec();

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

    return renameInput(updatedComponentSpecValues, oldName, newName);
  };

  // Check for name collision
  const checkNameCollision = (newName: string, currentInputName: string) => {
    if (!componentSpec.inputs) return false;

    // Check if any other input (not the current one) has the same name
    return componentSpec.inputs.some(
      (input) => input.name === newName && input.name !== currentInputName,
    );
  };

  const handleValueChange = (value: string) => {
    setInputValue(value);
  };

  const handleOptionalChange = (checked: boolean) => {
    setInputOptional(checked);
  };

  const handleTypeChange = (value: string) => {
    setInputType(value);
  };

  const handleNameChange = (newName: string) => {
    setInputName(newName);

    if (checkNameCollision(newName, input.name)) {
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
      inputOptional,
      inputType as string,
    );

    if (updatedComponentSpecWithValues) {
      setComponentSpec(updatedComponentSpecWithValues);
    }
    onSave?.();
  };

  const placeholder = input.default || `Enter ${input.name}...`;

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
        inputValue={inputOptional}
        disabled={disabled}
      />

      <Button onClick={handleSave} disabled={!!validationError}>
        Save
      </Button>
    </div>
  );
};
