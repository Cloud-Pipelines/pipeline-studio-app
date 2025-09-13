import { useCallback, useEffect, useMemo, useState } from "react";

import { updateInputNameOnComponentSpec } from "@/components/Editor/utils/updateInputNameOnComponentSpec";
import { ConfirmationDialog } from "@/components/shared/Dialogs";
import { InfoBox } from "@/components/shared/InfoBox";
import { useBetaFlagValue } from "@/components/shared/Settings/useBetaFlags";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Switch } from "@/components/ui/switch";
import { Heading, Paragraph, Text } from "@/components/ui/typography";
import useConfirmationDialog from "@/hooks/useConfirmationDialog";
import { useNodeSelectionTransfer } from "@/hooks/useNodeSelectionTransfer";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { useContextPanel } from "@/providers/ContextPanelProvider";
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
  const useToggleForBooleanFields = useBetaFlagValue(
    "use-toggle-for-boolean-fields",
  );
  const { transferSelection } = useNodeSelectionTransfer(inputNameToNodeId);
  const { componentSpec, setComponentSpec } = useComponentSpec();
  const { clearContent } = useContextPanel();
  const {
    handlers: confirmationHandlers,
    triggerDialog: triggerConfirmation,
    ...confirmationProps
  } = useConfirmationDialog();

  const initialInputValue = input.value ?? input.default ?? "";
  const initialIsOptional = false; // When optional inputs are permitted again change to: input.optional ?? true

  const [inputValue, setInputValue] = useState(initialInputValue);
  const [inputName, setInputName] = useState(input.name);
  const [inputType, setInputType] = useState(input.type?.toString() ?? "any");
  const [inputOptional, setInputOptional] = useState(initialIsOptional);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if the input type is Boolean
  const isBooleanType = useMemo(() => {
    const typeStr = inputType.toLowerCase();
    return typeStr === "boolean" || typeStr === "bool";
  }, [inputType]);

  // Only show toggle if beta flag is enabled
  const showBooleanToggle = useToggleForBooleanFields && isBooleanType;

  // Convert string value to boolean for switch
  const booleanValue = useMemo(() => {
    if (isBooleanType) {
      const val = inputValue.toLowerCase();
      return val === "true";
    }
    return false;
  }, [inputValue, isBooleanType]);

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

  const handleSwitchChange = useCallback((checked: boolean) => {
    const newValue = checked ? "True" : "False";
    setInputValue(newValue);
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

  const deleteNode = useCallback(async () => {
    if (!componentSpec.inputs) return;

    const confirmed = await triggerConfirmation({
      title: "Delete Input Node",
      description: `Are you sure you want to delete "${input.name}"?`,
      content: <Paragraph tone="subdued">This cannot be undone.</Paragraph>,
    });

    if (!confirmed) return;

    const updatedInputs = componentSpec.inputs.filter(
      (componentInput) => componentInput.name !== input.name,
    );

    const updatedComponentSpec = {
      ...componentSpec,
      inputs: updatedInputs,
    };

    setComponentSpec(updatedComponentSpec);

    clearContent();
  }, [
    componentSpec,
    input.name,
    setComponentSpec,
    clearContent,
    triggerConfirmation,
  ]);

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

      {/* Boolean toggle UI for Boolean types when beta flag is enabled */}
      {showBooleanToggle && (
        <BlockStack gap="1" className="w-full">
          <Text size="xs" tone="subdued" className="mb-1">
            Default Value
          </Text>
          <InlineStack gap="2" blockAlign="center">
            <Switch
              checked={booleanValue}
              onCheckedChange={handleSwitchChange}
              disabled={disabled}
            />
            <Text size="sm" tone="subdued">
              {booleanValue ? "True" : "False"}
            </Text>
          </InlineStack>
        </BlockStack>
      )}

      {/* Only show text field if not showing boolean toggle */}
      {!showBooleanToggle && (
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
      )}

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
    </BlockStack>
  );
};
