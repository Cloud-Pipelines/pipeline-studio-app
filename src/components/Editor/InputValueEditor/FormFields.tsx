import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { COMMON_TYPES, COMMON_TYPES_MAP } from "./constants";
import type { CommonType } from "./types";

const FormField = ({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="text-xs text-muted-foreground mb-1">
      {label}
    </label>
    {children}
  </div>
);

const NameField = ({
  inputName,
  onNameChange,
  onBlur,
  onKeyDown,
}: {
  inputName: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) => (
  <FormField label="Name" id={`input-name-${inputName}`}>
    <Input
      id={`input-name-${inputName}`}
      type="text"
      value={inputName}
      onChange={onNameChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className="text-sm"
    />
  </FormField>
);

const TypeField = ({
  commonType,
  onTypeChange,
  inputName,
}: {
  commonType: CommonType;
  onTypeChange: (newType: string) => void;
  inputName: string;
}) => (
  <FormField label="Type" id={`input-type-${inputName}`}>
    <Select value={commonType} onValueChange={onTypeChange}>
      <SelectTrigger id={`input-type-${inputName}`} className="h-9 text-xs">
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
  </FormField>
);

const ValueField = ({
  inputType,
  inputValue,
  onInputChange,
  onBlur,
  onKeyDown,
  placeholder,
  disabled,
  inputName,
}: {
  inputType: string;
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled: boolean;
  inputName: string;
}) => (
  <FormField label="Value" id={`input-value-${inputName}`}>
    <Input
      id={`input-value-${inputName}`}
      type={inputType}
      value={inputValue}
      onChange={onInputChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className="text-sm"
    />
  </FormField>
);

export { NameField, TypeField, ValueField };
