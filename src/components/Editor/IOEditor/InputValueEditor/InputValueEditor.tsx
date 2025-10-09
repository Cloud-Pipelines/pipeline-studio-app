import { useCallback, useEffect, useMemo, useState } from "react";

import { updateInputNameOnComponentSpec } from "@/components/Editor/utils/updateInputNameOnComponentSpec";
import { ConfirmationDialog } from "@/components/shared/Dialogs";
import { InfoBox } from "@/components/shared/InfoBox";
import { removeGraphInput } from "@/components/shared/ReactFlow/FlowCanvas/utils/removeNode";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack } from "@/components/ui/layout";
import { Heading, Paragraph } from "@/components/ui/typography";
import useConfirmationDialog from "@/hooks/useConfirmationDialog";
import { useNodeSelectionTransfer } from "@/hooks/useNodeSelectionTransfer";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { useContextPanel } from "@/providers/ContextPanelProvider";
import { type InputSpec } from "@/utils/componentSpec";
import { checkInputConnectionToRequiredFields } from "@/utils/inputConnectionUtils";
import { inputIdToNodeId, inputNameToInputId } from "@/utils/nodes/conversions";

import { NameField, TextField, TypeField } from "./FormFields/FormFields";
import { checkNameCollision } from "./FormFields/utils";
import { InputValueDialog } from "./InputValueDialog";

interface InputValueEditorProps {
  input: InputSpec;
  disabled?: boolean;
}

export const InputValueEditor = ({
  input,
  disabled = false,
}: InputValueEditorProps) => {
  const notify = useToastNotification();

  const inputNameToNodeId = useCallback((inputName: string): string => {
    const inputId = inputNameToInputId(inputName);
    return inputIdToNodeId(inputId);
  }, []);

  const { transferSelection } = useNodeSelectionTransfer(inputNameToNodeId);
  const { componentSpec, setComponentSpec } = useComponentSpec();
  const { clearContent } = useContextPanel();
  const {
    handlers: confirmationHandlers,
    triggerDialog: triggerConfirmation,
    ...confirmationProps
  } = useConfirmationDialog();

  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false);
  const [triggerSave, setTriggerSave] = useState(false);

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

      if (newName === "") {
        setValidationError("Input name cannot be empty");
        return;
      }

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
      inputName.trim(),
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

  const deleteNode = useCallback(async () => {
    if (!componentSpec.inputs) return;

    const confirmed = await triggerConfirmation({
      title: "Delete Input Node",
      description: `Are you sure you want to delete "${input.name}"?`,
      content: <Paragraph tone="subdued">This cannot be undone.</Paragraph>,
    });

    if (!confirmed) return;

    const updatedComponentSpec = removeGraphInput(inputName, componentSpec);

    setComponentSpec(updatedComponentSpec);

    clearContent();
  }, [
    componentSpec,
    input.name,
    setComponentSpec,
    clearContent,
    triggerConfirmation,
  ]);

  const handleExpandValueEditor = useCallback(() => {
    if (disabled) return;

    setIsValueDialogOpen(true);
  }, [disabled]);

  const handleDialogCancel = useCallback(() => {
    setIsValueDialogOpen(false);
  }, []);

  const handleDialogConfirm = useCallback((value: string) => {
    setInputValue(value);
    setIsValueDialogOpen(false);
    setTriggerSave(true);
  }, []);

  useEffect(() => {
    setInputValue(initialInputValue);
    setInputName(input.name);
    setInputType(input.type?.toString() ?? "any");
    setInputOptional(initialIsOptional);
    setValidationError(null);
  }, [input, initialInputValue, initialIsOptional]);

  useEffect(() => {
    if (triggerSave) {
      saveChanges();
      setTriggerSave(false);
    }
  }, [triggerSave, saveChanges]);

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
            icon: "Maximize2",
            hidden: disabled,
            onClick: handleExpandValueEditor,
          },
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

      {!disabled && (
        <Button onClick={deleteNode} variant="destructive" size="icon">
          <Icon name="Trash2" />
        </Button>
      )}

      <ConfirmationDialog
        {...confirmationProps}
        onConfirm={() => confirmationHandlers?.onConfirm()}
        onCancel={() => confirmationHandlers?.onCancel()}
      />

      <InputValueDialog
        input={input}
        value={inputValue}
        placeholder={placeholder}
        open={isValueDialogOpen}
        onCancel={handleDialogCancel}
        onConfirm={handleDialogConfirm}
      />
    </BlockStack>
  );
};
