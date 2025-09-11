import { AlertTriangle } from "lucide-react";
import { type ChangeEvent, useCallback, useState } from "react";

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
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  onDelete?: () => void;
}

export const AnnotationsInput = ({
  value = "",
  config,
  annotations,
  deletable = false,
  autoFocus = false,
  className = "",
  onChange,
  onBlur,
  onDelete,
}: AnnotationsInputProps) => {
  const [isInvalid, setIsInvalid] = useState(false);
  const [lastSavedValue, setLastSavedValue] = useState(value);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const inputType = config?.type ?? "string";
  const placeholder = config?.label ?? "";

  const handleExpand = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleDialogConfirm = useCallback(
    (newValue: string) => {
      onChange(newValue);
      setIsDialogOpen(false);
      if (onBlur && newValue !== lastSavedValue) {
        onBlur(newValue);
        setLastSavedValue(newValue);
      }
    },
    [onChange, onBlur, lastSavedValue],
  );

  const handleDialogCancel = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const validateChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      onChange(newValue);

      try {
        JSON.parse(newValue);
        setIsInvalid(false);
      } catch {
        setIsInvalid(true);
      }
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    if (onBlur && lastSavedValue !== value) {
      if (config?.type === "number" && !isNaN(Number(value)) && value !== "") {
        value = clamp(Number(value), config.min, config.max).toString();
      }

      onBlur(value);
      setLastSavedValue(value);
    }
  }, [onBlur, lastSavedValue, value]);

  const handleQuantityKeyInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!config?.annotation) return;

      const selectedKey = getAnnotationKey(config.annotation, annotations);

      if (!selectedKey) return;

      const newObj = { [selectedKey]: e.target.value };

      onChange(JSON.stringify(newObj));
    },
    [config, annotations, onChange],
  );

  const shouldSaveQuantityField = useCallback(() => {
    if (!config?.enableQuantity || !config?.annotation) return false;

    const selectedKey = getAnnotationKey(config.annotation, annotations);
    const quantity = getAnnotationValue(config.annotation, annotations);
    return !!selectedKey && !!quantity && quantity.trim() !== "";
  }, [config, annotations]);

  const handleQuantitySelectChange = useCallback(
    (selectedKey: string) => {
      if (!config?.annotation) return;

      const quantity = getAnnotationValue(config.annotation, annotations);
      const newObj = selectedKey ? { [selectedKey]: quantity } : {};
      const newValue = JSON.stringify(newObj);

      onChange(newValue);

      if (onBlur && newValue !== lastSavedValue && shouldSaveQuantityField()) {
        onBlur(newValue);
        setLastSavedValue(newValue);
      }
    },
    [
      config,
      annotations,
      onChange,
      onBlur,
      lastSavedValue,
      shouldSaveQuantityField,
    ],
  );

  const handleNonQuantitySelectChange = useCallback(
    (selectedKey: string) => {
      onChange(selectedKey);

      if (onBlur && selectedKey !== lastSavedValue) {
        onBlur(selectedKey);
        setLastSavedValue(selectedKey);
      }
    },
    [onChange, onBlur, lastSavedValue],
  );

  const handleClearSelection = useCallback(() => {
    if (config?.enableQuantity) {
      const newValue = "";
      onChange(newValue);
      if (onBlur && newValue !== lastSavedValue) {
        onBlur(newValue);
        setLastSavedValue(newValue);
      }
    } else {
      onChange("");
      if (onBlur && "" !== lastSavedValue) {
        onBlur("");
        setLastSavedValue("");
      }
    }
  }, [config, onChange, onBlur, lastSavedValue]);

  const handleSwitchChange = useCallback(
    (checked: boolean) => {
      const newValue = checked ? "true" : "false";
      onChange(newValue);
      if (onBlur && newValue !== lastSavedValue) {
        onBlur(newValue);
        setLastSavedValue(newValue);
      }
    },
    [onChange, onBlur, lastSavedValue],
  );

  let inputElement = null;

  if (config?.options && config.options.length > 0) {
    const currentValue = config?.enableQuantity
      ? getAnnotationKey(config.annotation, annotations)
      : value;

    inputElement = (
      <div className="flex items-center gap-1 grow">
        <Select
          value={currentValue}
          onValueChange={
            config?.enableQuantity
              ? handleQuantitySelectChange
              : handleNonQuantitySelectChange
          }
        >
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
        checked={value === "true"}
        onCheckedChange={handleSwitchChange}
        className={className}
      />
    );
  } else if (inputType === "number") {
    inputElement = (
      <InlineStack gap="2" blockAlign="center" wrap="nowrap" className="grow">
        <Input
          type="number"
          value={value}
          min={config?.min}
          max={config?.max}
          onChange={(e) => onChange(e.target.value)}
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
    inputElement = (
      <div className="flex-1 w-full relative group">
        <Input
          value={
            config?.enableQuantity
              ? getAnnotationKey(config.annotation, annotations)
              : value
          }
          onChange={
            config?.enableQuantity
              ? handleQuantityKeyInputChange
              : validateChange
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
            onChange={onChange}
            onBlur={onBlur}
            shouldSave={shouldSaveQuantityField}
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
          initialValue={value}
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
  onChange,
  onBlur,
  shouldSave,
}: {
  annotation: string;
  annotations: Annotations;
  min?: number;
  max?: number;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  shouldSave: () => boolean;
}) => {
  const currentQuantity = getAnnotationValue(annotation, annotations);
  const [lastSavedQuantity, setLastSavedQuantity] = useState(currentQuantity);

  const handleValueInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedKey = getAnnotationKey(annotation, annotations);

      if (!selectedKey) return;

      const newObj = { [selectedKey]: e.target.value };

      onChange(JSON.stringify(newObj));
    },
    [annotation, annotations, onChange],
  );

  const handleValueBlur = useCallback(() => {
    const selectedKey = getAnnotationKey(annotation, annotations);

    if (!selectedKey) return;

    const quantity = getAnnotationValue(annotation, annotations);

    if (onBlur && quantity !== lastSavedQuantity && shouldSave()) {
      let limitedQuantity = Number(quantity);
      if (!isNaN(limitedQuantity) && quantity !== "") {
        limitedQuantity = clamp(limitedQuantity, min, max);
      }

      const newObj = { [selectedKey]: limitedQuantity };
      const newValue = JSON.stringify(newObj);

      onBlur(newValue);
      setLastSavedQuantity(limitedQuantity);
    }
  }, [
    annotation,
    annotations,
    min,
    max,
    onBlur,
    lastSavedQuantity,
    shouldSave,
  ]);

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
        value={getAnnotationValue(annotation, annotations)}
        min={min}
        max={max}
        onChange={handleValueInputChange}
        onBlur={handleValueBlur}
        className={cn(
          "min-w-12 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          !currentQuantity && !disabled && "border-destructive/50",
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
