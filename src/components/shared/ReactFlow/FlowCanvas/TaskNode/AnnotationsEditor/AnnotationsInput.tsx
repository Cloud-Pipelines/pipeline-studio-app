import { AlertTriangle } from "lucide-react";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";

import { MultilineTextInputDialog } from "@/components/shared/Dialogs/MultilineTextInputDialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { InlineStack } from "@/components/ui/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Paragraph } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { AnnotationConfig, Annotations } from "@/types/annotations";
import { clamp } from "@/utils/math";

interface AnnotationsInputProps {
  value: string;
  config?: AnnotationConfig;
  annotations: Annotations;
  deletable?: boolean;
  autoFocus?: boolean;
  className?: string;
  onSave: (value: string) => void;
  onDelete?: () => void;
}

export const AnnotationsInput = ({
  value = "",
  config,
  annotations,
  deletable = false,
  autoFocus = false,
  className = "",
  onSave,
  onDelete,
}: AnnotationsInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [lastSavedValue, setLastSavedValue] = useState(value);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const inputType = config?.type ?? "string";
  const placeholder = config?.label ?? "";

  const handleSubmit = useCallback(
    (newValue: string) => {
      if (newValue === lastSavedValue) return;

      onSave(newValue);
      setLastSavedValue(newValue);
    },
    [onSave, lastSavedValue],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      if (config?.type === "string") {
        try {
          JSON.parse(newValue);
          setIsInvalid(false);
        } catch {
          setIsInvalid(true);
        }
      }
    },
    [config?.type],
  );

  const handleBlur = useCallback(() => {
    let valueToSave = inputValue.trim();

    if (
      config?.type === "number" &&
      !isNaN(Number(valueToSave)) &&
      valueToSave !== ""
    ) {
      valueToSave = clamp(
        Number(valueToSave),
        config.min,
        config.max,
      ).toString();
      setInputValue(valueToSave);
    }

    handleSubmit(valueToSave);
  }, [inputValue, config, handleSubmit]);

  const handleExpand = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleDialogConfirm = useCallback(
    (newValue: string) => {
      setInputValue(newValue);
      setIsDialogOpen(false);
      handleSubmit(newValue);
    },
    [handleSubmit],
  );

  const handleDialogCancel = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const handleQuantityKeyInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!config?.annotation) return;

      const selectedKey = getAnnotationKey(config.annotation, annotations);
      if (!selectedKey) return;

      const newObj = { [selectedKey]: e.target.value };
      const newValue = JSON.stringify(newObj);

      setInputValue(newValue);
    },
    [config, annotations],
  );

  const handleSelectChange = useCallback(
    (selectedKey: string) => {
      if (!config?.annotation) return;

      let newValue: string;

      if (config.enableQuantity) {
        const quantity = getAnnotationValue(config.annotation, annotations);
        const newObj = selectedKey ? { [selectedKey]: quantity } : {};
        newValue = JSON.stringify(newObj);
      } else {
        newValue = selectedKey;
      }

      setInputValue(newValue);
      handleSubmit(newValue);
    },
    [config, annotations, handleSubmit],
  );

  const handleClearSelection = useCallback(() => {
    const newValue = "";
    setInputValue(newValue);
    handleSubmit(newValue);
  }, [handleSubmit]);

  const handleSwitchChange = useCallback(
    (checked: boolean) => {
      const newValue = checked ? "true" : "false";
      setInputValue(newValue);
      handleSubmit(newValue);
    },
    [handleSubmit],
  );

  let inputElement = null;

  if (config?.options && config.options.length > 0) {
    const currentValue = config?.enableQuantity
      ? getAnnotationKey(config.annotation, annotations)
      : inputValue;

    inputElement = (
      <div className="flex items-center gap-1 grow">
        <Select value={currentValue} onValueChange={handleSelectChange}>
          <div className="relative group grow min-w-24">
            <SelectTrigger className={cn("w-full", className)}>
              <SelectValue placeholder={"Select " + placeholder} />
            </SelectTrigger>
            {!!currentValue && (
              <Button
                variant="ghost"
                size="min"
                className="absolute right-8 top-1/2 -translate-y-1/2 hidden group-hover:block"
                onClick={handleClearSelection}
              >
                <Icon name="X" className="size-3 text-muted-foreground" />
              </Button>
            )}
          </div>
          <SelectContent>
            {config.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  } else if (inputType === "boolean") {
    inputElement = (
      <Switch
        checked={inputValue === "true"}
        onCheckedChange={handleSwitchChange}
        className={className}
      />
    );
  } else if (inputType === "number") {
    inputElement = (
      <InlineStack gap="2" blockAlign="center" wrap="nowrap" className="grow">
        <Input
          type="number"
          value={inputValue}
          min={config?.min}
          max={config?.max}
          onChange={handleInputChange}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          className={className}
        />
        {config?.max !== undefined && (
          <Paragraph size="xs" tone="subdued" className="whitespace-nowrap">
            (max: {config.max})
          </Paragraph>
        )}
      </InlineStack>
    );
  } else {
    const displayValue = config?.enableQuantity
      ? getAnnotationKey(config.annotation, annotations)
      : inputValue;

    inputElement = (
      <div className="flex-1 w-full relative group">
        <Input
          value={displayValue}
          onChange={
            config?.enableQuantity
              ? handleQuantityKeyInputChange
              : handleInputChange
          }
          onBlur={handleBlur}
          autoFocus={autoFocus}
          className={cn("min-w-16", className)}
        />
        <Button
          className="absolute right-0 top-1/2 -translate-y-1/2 hover:bg-transparent hover:text-blue-500 hidden group-hover:flex h-8 w-8 p-0"
          onClick={handleExpand}
          variant="ghost"
          type="button"
        >
          <Icon name="Maximize2" />
        </Button>
        {isInvalid && (
          <div className="flex items-center gap-1 my-1 text-xs text-warning">
            <AlertTriangle className="w-4 h-4" /> Invalid JSON
          </div>
        )}
      </div>
    );
  }

  const dialogTitle = `Edit ${config?.label ?? "Annotation"}`;

  return (
    <>
      <InlineStack gap="2" blockAlign="center" className="grow flex-wrap">
        {inputElement}
        {config?.enableQuantity && (
          <QuantityInput
            annotation={config.annotation}
            annotations={annotations}
            min={config.min}
            max={config.max}
            disabled={!getAnnotationKey(config.annotation, annotations)}
            onSave={onSave}
          />
        )}
        {deletable && onDelete && (
          <Button variant="ghost" size="icon" onClick={onDelete} title="Remove">
            <Icon name="Trash" className="text-destructive" />
          </Button>
        )}
      </InlineStack>

      {inputType === "string" && !config?.options && (
        <MultilineTextInputDialog
          title={dialogTitle}
          description="Enter a value for this annotation."
          placeholder={placeholder}
          initialValue={inputValue}
          open={isDialogOpen}
          onCancel={handleDialogCancel}
          onConfirm={handleDialogConfirm}
        />
      )}
    </>
  );
};

const QuantityInput = ({
  annotation,
  annotations,
  min,
  max,
  disabled,
  onSave,
}: {
  annotation: string;
  annotations: Annotations;
  min?: number;
  max?: number;
  disabled: boolean;
  onSave: (value: string) => void;
}) => {
  const currentQuantity = getAnnotationValue(annotation, annotations);
  const [inputValue, setInputValue] = useState(currentQuantity);
  const [lastSavedValue, setLastSavedValue] = useState(currentQuantity);

  useEffect(() => {
    if (currentQuantity !== inputValue && currentQuantity !== lastSavedValue) {
      setInputValue(currentQuantity);
      setLastSavedValue(currentQuantity);
    }
  }, [currentQuantity, inputValue, lastSavedValue]);

  const handleSubmit = useCallback(
    (value: string) => {
      if (value === lastSavedValue) return;

      const selectedKey = getAnnotationKey(annotation, annotations);
      if (!selectedKey) return;

      let limitedQuantity = Number(value);
      if (!isNaN(limitedQuantity) && value !== "") {
        limitedQuantity = clamp(limitedQuantity, min, max);
      }

      const newObj = { [selectedKey]: limitedQuantity };
      const newValue = JSON.stringify(newObj);

      onSave(newValue);
      setLastSavedValue(limitedQuantity.toString());
    },
    [annotation, annotations, min, max, onSave, lastSavedValue],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      const selectedKey = getAnnotationKey(annotation, annotations);
      if (selectedKey) {
        const newObj = { [selectedKey]: newValue };
        onSave(JSON.stringify(newObj));
      }
    },
    [annotation, annotations, onSave],
  );

  const handleBlur = useCallback(() => {
    handleSubmit(inputValue);
  }, [inputValue, handleSubmit]);

  return (
    <InlineStack
      gap="2"
      blockAlign="center"
      wrap="nowrap"
      className="max-w-1/3"
    >
      <span>x</span>
      <Input
        type="number"
        value={inputValue}
        min={min}
        max={max}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className={cn(
          "min-w-12 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          !inputValue && !disabled && "border-destructive/50",
        )}
        disabled={disabled}
      />
      {max !== undefined && (
        <Paragraph size="xs" tone="subdued" className="whitespace-nowrap">
          (max: {max})
        </Paragraph>
      )}
    </InlineStack>
  );
};

function getAnnotationKey(annotation: string, annotations: Annotations) {
  try {
    const obj = JSON.parse(annotations[annotation] || "{}");
    return Object.keys(obj)[0] || "";
  } catch {
    return "";
  }
}

function getAnnotationValue(annotation: string, annotations: Annotations) {
  try {
    const obj = JSON.parse(annotations[annotation] || "{}");
    return obj[Object.keys(obj)[0]] || "";
  } catch {
    return "";
  }
}
