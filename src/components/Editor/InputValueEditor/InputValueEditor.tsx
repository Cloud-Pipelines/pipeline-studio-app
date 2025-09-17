import { useCallback, useEffect, useMemo, useState } from "react";

import { updateInputNameOnComponentSpec } from "@/components/shared/ReactFlow/FlowCanvas/utils/updateInputNameOnComponentSpec";
import { Button } from "@/components/ui/button";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { type InputSpec } from "@/utils/componentSpec";
import { checkInputConnectionToRequiredFields } from "@/utils/inputConnectionUtils";

import {
  NameField,
  OptionalField,
  TextField,
  TypeField,
} from "./FormFields/FormFields";
import { checkNameCollision } from "./FormFields/utils";

interface InputValueEditorProps {
  input: InputSpec;
  disabled?: boolean;
  onClose?: () => void;
}

export const InputValueEditor = ({
  input,
  disabled = false,
  onClose,
}: InputValueEditorProps) => {
  const notify = useToastNotification();

  const [inputValue, setInputValue] = useState(input.value ?? "");
  const [inputName, setInputName] = useState(input.name);
  const [inputType, setInputType] = useState(input.type?.toString() ?? "any");
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

  const hasChanges = useCallback(() => {
    return (
      inputValue !== (input.value ?? "") ||
      inputName !== input.name ||
      inputType !== (input.type?.toString() ?? "any") ||
      inputOptional !== (input.optional ?? true)
    );
  }, [inputValue, inputName, inputType, inputOptional, input]);

  const saveChanges = useCallback(() => {
    if (!hasChanges() || validationError) return;

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
  }, [
    hasChanges,
    validationError,
    input.name,
    inputValue,
    inputName,
    effectiveOptionalValue,
    inputType,
  ]);

  const handleBlur = useCallback(() => {
    saveChanges();
  }, [saveChanges]);

  const handleClose = useCallback(() => {
    saveChanges();
    onClose?.();
  }, [saveChanges, onClose]);

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

  const placeholder = input.default || `Enter ${input.name}...`;

  const handleCopyValue = () => {
    if (inputValue) {
      void navigator.clipboard.writeText(inputValue);
      notify("Input value copied to clipboard", "success");
    }
  };

  useEffect(() => {
    setInputValue(input.value ?? "");
    setInputName(input.name);
    setInputType(input.type?.toString() ?? "any");
    setInputOptional(input.optional ?? true);
    setValidationError(null);
  }, [input]);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold">{input.name}</h3>
        <p className="text-sm text-gray-500">{input.description}</p>
      </div>
      <NameField
        inputName={inputName}
        onNameChange={handleNameChange}
        onBlur={handleBlur}
        error={validationError}
        disabled={disabled}
      />

      <TextField
        inputValue={inputValue}
        onInputChange={handleValueChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        inputName={input.name}
        actions={[
          {
            icon: "Copy",
            hidden: !disabled && !inputValue,
            onClick: handleCopyValue,
          },
        ]}
      />

      <TypeField
        inputValue={inputType}
        onInputChange={handleTypeChange}
        onBlur={handleBlur}
        placeholder="Type: Any"
        disabled={disabled}
        inputName={input.name}
      />

      <OptionalField
        inputName={input.name}
        onInputChange={handleOptionalChange}
        onBlur={handleBlur}
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
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
      </div>
    </div>
  );
};
