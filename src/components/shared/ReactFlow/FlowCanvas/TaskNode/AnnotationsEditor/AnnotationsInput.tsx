import { AlertTriangle, TrashIcon } from "lucide-react";
import { type ChangeEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { AnnotationConfig, Annotations } from "@/types/annotations";

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

  const inputType = config?.type ?? "string";
  const placeholder = config?.label ?? "";

  const validateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    try {
      JSON.parse(newValue);
      setIsInvalid(false);
    } catch {
      setIsInvalid(true);
    }
  };

  const handleBlur = () => {
    if (onBlur && lastSavedValue !== value) {
      onBlur(value);
      setLastSavedValue(value);
    }
  };

  const handleQuantityKeyInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!config?.annotation) return;
    const selectedKey = getAnnotationKey(config.annotation, annotations);
    if (!selectedKey) return;
    const newObj = { [selectedKey]: e.target.value };
    onChange(JSON.stringify(newObj));
  };

  const shouldSaveQuantityField = () => {
    if (!config?.enableQuantity || !config?.annotation) return false;
    const selectedKey = getAnnotationKey(config.annotation, annotations);
    const quantity = getAnnotationValue(config.annotation, annotations);
    return !!selectedKey && !!quantity && quantity.trim() !== "";
  };

  const handleQuantitySelectChange = (selectedKey: string) => {
    if (!config?.annotation) return;
    const quantity = getAnnotationValue(config.annotation, annotations);
    const newObj = selectedKey ? { [selectedKey]: quantity } : {};
    const newValue = JSON.stringify(newObj);
    onChange(newValue);

    if (onBlur && newValue !== lastSavedValue && shouldSaveQuantityField()) {
      onBlur(newValue);
      setLastSavedValue(newValue);
    }
  };

  const handleNonQuantitySelectChange = (selectedKey: string) => {
    onChange(selectedKey);
    if (onBlur && selectedKey !== lastSavedValue) {
      onBlur(selectedKey);
      setLastSavedValue(selectedKey);
    }
  };

  const handleClearSelection = () => {
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
  };

  const handleSwitchChange = (checked: boolean) => {
    const newValue = checked ? "true" : "false";
    onChange(newValue);
    if (onBlur && newValue !== lastSavedValue) {
      onBlur(newValue);
      setLastSavedValue(newValue);
    }
  };

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
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        className={className}
      />
    );
  } else {
    inputElement = (
      <div className="flex-1 w-full relative">
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
        {isInvalid && (
          <div className="flex items-center gap-1 my-1 text-xs text-warning">
            <AlertTriangle className="w-4 h-4" /> Invalid JSON
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 grow flex-wrap">
      {inputElement}
      {config?.enableQuantity && (
        <QuantityInput
          annotation={config.annotation}
          annotations={annotations}
          disabled={!getAnnotationKey(config.annotation, annotations)}
          onChange={onChange}
          onBlur={onBlur}
          shouldSave={shouldSaveQuantityField}
        />
      )}
      {deletable && onDelete && (
        <Button variant="ghost" size="icon" onClick={onDelete} title="Remove">
          <TrashIcon className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
};

const QuantityInput = ({
  annotation,
  annotations,
  disabled,
  onChange,
  onBlur,
  shouldSave,
}: {
  annotation: string;
  annotations: Annotations;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  shouldSave: () => boolean;
}) => {
  const currentQuantity = getAnnotationValue(annotation, annotations);
  const [lastSavedQuantity, setLastSavedQuantity] = useState(currentQuantity);

  const handleValueInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedKey = getAnnotationKey(annotation, annotations);
    if (!selectedKey) return;
    const newObj = { [selectedKey]: e.target.value };
    onChange(JSON.stringify(newObj));
  };

  const handleValueBlur = () => {
    const selectedKey = getAnnotationKey(annotation, annotations);
    if (!selectedKey) return;
    const quantity = getAnnotationValue(annotation, annotations);
    const newObj = { [selectedKey]: quantity };
    const newValue = JSON.stringify(newObj);
    if (onBlur && quantity !== lastSavedQuantity && shouldSave()) {
      onBlur(newValue);
      setLastSavedQuantity(quantity);
    }
  };

  return (
    <div className="flex items-center gap-2 max-w-1/3">
      <span>x</span>
      <Input
        type="number"
        value={getAnnotationValue(annotation, annotations)}
        onChange={handleValueInputChange}
        onBlur={handleValueBlur}
        className={cn(
          "min-w-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          !currentQuantity && !disabled && "border-destructive/50",
        )}
        disabled={disabled}
      />
    </div>
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
