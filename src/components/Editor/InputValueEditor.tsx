import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InputSpec, TypeSpecType } from "@/utils/componentSpec";

const COMMON_TYPES = ["String", "Number", "Boolean", "DateTime"] as const;
const COMMON_TYPES_MAP = {
  String: "Text",
  Number: "Number",
  Boolean: "Checkbox",
  DateTime: "Date & Time",
} as const;

type CommonType = (typeof COMMON_TYPES)[number];

interface InputValueEditorProps {
  input: InputSpec;
  value: string;
  onChange: (inputName: string, value: string) => void;
  onTypeChange?: (inputName: string, type: TypeSpecType) => void;
  onNameChange?: (newName: string, oldName: string) => void;
  disabled?: boolean;
}

export const InputValueEditor = ({
  input,
  value,
  onChange,
  onTypeChange,
  onNameChange,
  disabled = false,
}: InputValueEditorProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [inputName, setInputName] = useState(input.name);

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputName(newValue);
  };

  const handleBlur = () => {
    onChange(input.name, inputValue);
  };

  const handleNameBlur = () => {
    if (onNameChange) {
      onNameChange(inputName, input.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleTypeChange = (newType: string) => {
    if (onTypeChange) {
      onTypeChange(input.name, newType);
    }
  };

  const getInputType = () => {
    if (!input.type) return "text";

    const type = typeof input.type === "string" ? input.type : "object";

    switch (type.toLowerCase()) {
      case "integer":
      case "number":
        return "number";
      case "datetime":
        return "datetime-local";
      case "boolean":
        return "checkbox";
      default:
        return "text";
    }
  };

  const getCurrentType = (): CommonType => {
    if (!input.type) return "String";

    const type = typeof input.type === "string" ? input.type : "Object";

    switch (type.toLowerCase()) {
      case "string":
        return "String";
      case "integer":
      case "int":
        return "Number";
      case "number":
      case "float":
      case "double":
        return "Number";
      case "boolean":
      case "bool":
        return "Boolean";
      case "datetime":
      case "date":
      case "time":
        return "DateTime";
      case "array":
      case "list":
        return "String";
      case "object":
      case "dict":
      case "map":
        return "String";
      case "file":
        return "String";
      case "directory":
      case "dir":
        return "String";
      case "json":
        return "String";
      case "yaml":
      case "yml":
        return "String";
      default:
        return "String";
    }
  };

  const inputType = getInputType();
  const currentType = getCurrentType();

  return (
    <div className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col">
          <label
            htmlFor={`input-name-${input.name}`}
            className="text-xs text-muted-foreground mb-1"
          >
            Name
          </label>
          <Input
            id={`input-name-${input.name}`}
            type="text"
            value={inputName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
        </div>
        <div className="w-36 flex flex-col">
          <label
            htmlFor={`input-type-${input.name}`}
            className="text-xs text-muted-foreground mb-1"
          >
            Type
          </label>
          <Select value={currentType} onValueChange={handleTypeChange}>
            <SelectTrigger
              id={`input-type-${input.name}`}
              className="h-9 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMON_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="text-xs">
                  {COMMON_TYPES_MAP[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col">
        <label
          htmlFor={`input-value-${input.name}`}
          className="text-xs text-muted-foreground mb-1"
        >
          Value
        </label>
        <Input
          id={`input-value-${input.name}`}
          type={inputType}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={input.default || `Enter ${input.name}...`}
          disabled={disabled}
          className="text-sm"
        />
      </div>
      {input.description && (
        <div className="text-xs text-gray-500 mt-1">{input.description}</div>
      )}
    </div>
  );
};
