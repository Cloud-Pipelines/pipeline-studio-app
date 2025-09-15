import { useCallback, useEffect, useMemo, useState } from "react";

import { updateInputNameOnComponentSpec } from "@/components/Editor/utils/updateInputNameOnComponentSpec";
import { InfoBox } from "@/components/shared/InfoBox";
import { BlockStack } from "@/components/ui/layout";
import { Heading, Paragraph } from "@/components/ui/typography";
import { useNodeSelectionTransfer } from "@/hooks/useNodeSelectionTransfer";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { type InputSpec } from "@/utils/componentSpec";
import { checkInputConnectionToRequiredFields } from "@/utils/inputConnectionUtils";
import { inputNameToNodeId } from "@/utils/nodes/nodeIdUtils";

import { NameField, TextField, TypeField } from "./FormFields/FormFields";
import { checkNameCollision } from "./FormFields/utils";

interface InputValueEditorProps {
  input: InputSpec;
  disabled?: boolean;
}

export const InputValueEditor = ({
  input,
  disabled = false,
}: InputValueEditorProps) => {
  const notify = useToastNotification();
  const { transferSelection } = useNodeSelectionTransfer(inputNameToNodeId);
  const { componentSpec, setComponentSpec } = useComponentSpec();

  const initialInputValue = input.value ?? input.default ?? "";
  const initialIsOptional = false; // When optional inputs are permitted again change to: input.optional ?? true

  const [inputValue, setInputValue] = useState(initialInputValue);
  const [inputName, setInputName] = useState(input.name);
  const [inputType, setInputType] = useState(input.type?.toString() ?? "any");
  const [inputOptional, setInputOptional] = useState(initialIsOptional);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if this input is connected to any required fields
  const { isConnectedToRequired } = useMemo(() => {
    return checkInputConnectionToRequiredFields(input.name, componentSpec);
  }, [input.name, componentSpec]);

  const effectiveOptionalValue = isConnectedToRequired ? false : inputOptional;

  const handleInputChange = useCallback(
    (
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

      const updatedComponentSpec = updateInputNameOnComponentSpec(
        updatedComponentSpecValues,
        oldName,
        newName,
      );

      transferSelection(oldName, newName);

      return updatedComponentSpec;
    },
    [componentSpec, transferSelection],
  );

  const handleValueChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setInputType(value);
  }, []);

  const handleNameChange = useCallback(
    (newName: string) => {
      setInputName(newName);

      if (checkNameCollision(newName, input.name, componentSpec, "inputs")) {
        setValidationError("An input with this name already exists");
        return;
      }

      setValidationError(null);
    },
    [input.name, componentSpec],
  );

  const hasChanges = useCallback(() => {
    return (
      inputValue !== initialInputValue ||
      inputName !== input.name ||
      inputType !== (input.type?.toString() ?? "any") ||
      inputOptional !== initialIsOptional
    );
  }, [
    inputValue,
    inputName,
    inputType,
    inputOptional,
    initialInputValue,
    initialIsOptional,
    input,
  ]);

  const saveChanges = useCallback(() => {
    if (!hasChanges() || validationError) return;

    const updatedComponentSpecWithValues = handleInputChange(
      input.name,
      inputValue.trim(),
      inputName,
      effectiveOptionalValue,
      inputType as string,
    );

    if (updatedComponentSpecWithValues) {
      setComponentSpec(updatedComponentSpecWithValues);
    }
  }, [
    handleInputChange,
    setComponentSpec,
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

  const handleCopyValue = useCallback(() => {
    if (inputValue.trim()) {
      void navigator.clipboard.writeText(inputValue.trim());
      notify("Input value copied to clipboard", "success");
    }
  }, [inputValue]);

  useEffect(() => {
    setInputValue(initialInputValue);
    setInputName(input.name);
    setInputType(input.type?.toString() ?? "any");
    setInputOptional(initialIsOptional);
    setValidationError(null);
  }, [input, initialInputValue, initialIsOptional]);

  const placeholder = input.default ?? `Enter ${input.name}...`;

  return (
    <BlockStack gap="3" className="p-4 w-full">
      <BlockStack gap="3">
        <Heading level={1}>{input.name}</Heading>
        {!!input.description && (
          <Paragraph size="sm" tone="subdued">
            {input.description}
          </Paragraph>
        )}
      </BlockStack>
      <NameField
        inputName={inputName}
        onNameChange={handleNameChange}
        onBlur={handleBlur}
        error={validationError}
        disabled={disabled}
        autoFocus={!disabled}
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

      {!initialInputValue && !inputOptional && (
        <InfoBox title="Missing value" variant="error">
          Input is not optional. Value is required.
        </InfoBox>
      )}
    </BlockStack>
  );
};
