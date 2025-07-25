import { AlertTriangle, TrashIcon } from "lucide-react";
import { type ChangeEvent, useState } from "react";

import { Button } from "@/components/ui/button";
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
  onDelete,
}: AnnotationsInputProps) => {
  const [isInvalid, setIsInvalid] = useState(false);

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

  const handleQuantityKeyInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!config?.annotation) return;
    const selectedKey = getAnnotationKey(config.annotation, annotations);
    if (!selectedKey) return;
    const newObj = { [selectedKey]: e.target.value };
    onChange(JSON.stringify(newObj));
  };

  const handleQuantitySelectChange = (selectedKey: string) => {
    if (!config?.annotation) return;
    const quantity = getAnnotationValue(config.annotation, annotations);
    const newObj = selectedKey ? { [selectedKey]: quantity } : {};
    onChange(JSON.stringify(newObj));
  };

  let inputElement = null;

  if (config?.options && config.options.length > 0) {
    inputElement = (
      <Select
        value={
          config?.enableQuantity
            ? getAnnotationKey(config.annotation, annotations)
            : value
        }
        onValueChange={
          config?.enableQuantity ? handleQuantitySelectChange : onChange
        }
      >
        <SelectTrigger className={cn("min-w-24 grow", className)}>
          <SelectValue placeholder={"Select " + placeholder} />
        </SelectTrigger>
        <SelectContent>
          {config.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else if (inputType === "boolean") {
    inputElement = (
      <Switch
        checked={value === "true"}
        onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
        className={className}
      />
    );
  } else if (inputType === "number") {
    inputElement = (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
}: {
  annotation: string;
  annotations: Annotations;
  disabled: boolean;
  onChange: (value: string) => void;
}) => {
  const handleValueInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedKey = getAnnotationKey(annotation, annotations);
    if (!selectedKey) return;
    const newObj = { [selectedKey]: e.target.value };
    onChange(JSON.stringify(newObj));
  };

  return (
    <div className="flex items-center gap-2 max-w-1/3">
      <span>x</span>
      <Input
        type="number"
        value={getAnnotationValue(annotation, annotations)}
        onChange={handleValueInputChange}
        className="min-w-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
