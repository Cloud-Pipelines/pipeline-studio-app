import type { icons } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type FormFieldAction = {
  icon: keyof typeof icons;
  disabled?: boolean;
  hidden?: boolean;
  onClick: () => void;
};

const FormField = ({
  label,
  id,
  actions,
  children,
}: {
  label: string;
  id: string;
  actions?: FormFieldAction[];
  children: ReactNode;
}) => (
  <BlockStack>
    <InlineStack
      align="space-between"
      blockAlign="center"
      className="w-full mb-1"
    >
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      {actions?.map(
        (action) =>
          !action.hidden && (
            <Button
              key={action.icon}
              variant="ghost"
              onClick={action.onClick}
              disabled={action.disabled}
              size="min"
            >
              <Icon name={action.icon} size="xs" />
            </Button>
          ),
      )}
    </InlineStack>
    {children}
  </BlockStack>
);

const NameField = ({
  inputName,
  onNameChange,
  onBlur,
  error,
  disabled,
}: {
  inputName: string;
  onNameChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  disabled?: boolean;
}) => (
  <FormField label="Name" id={`input-name-${inputName}`}>
    <Input
      id={`input-name-${inputName}`}
      disabled={disabled}
      type="text"
      value={inputName}
      onChange={(e) => onNameChange(e.target.value)}
      onBlur={onBlur}
      className={cn("text-sm", {
        "border-red-500 focus:border-red-500": !!error,
      })}
    />
    {!!error && <div className="text-xs text-red-500 mt-1">{error}</div>}
  </FormField>
);

const TextField = ({
  inputValue,
  onInputChange,
  onBlur,
  placeholder,
  disabled,
  inputName,
  actions,
}: {
  inputValue: string;
  onInputChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  disabled: boolean;
  inputName: string;
  actions?: FormFieldAction[];
}) => (
  <FormField
    label="Default Value"
    id={`input-value-${inputName}`}
    actions={actions}
  >
    <Textarea
      id={`input-value-${inputName}`}
      value={inputValue}
      onChange={(e) => onInputChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className="text-sm"
    />
  </FormField>
);

const OptionalField = ({
  inputName,
  onInputChange,
  onBlur,
  disabled = false,
  inputValue,
}: {
  inputName: string;
  onInputChange: (checked: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
  inputValue: boolean;
}) => (
  <div className="flex items-center gap-2 mt-2">
    <Checkbox
      id={`input-optional-${inputName}`}
      checked={inputValue}
      onCheckedChange={onInputChange}
      onBlur={onBlur}
      disabled={disabled}
      className="h-5 w-5 border-gray-300 focus:ring-2 focus:ring-primary-500 transition-colors"
    />
    <label
      htmlFor={`input-optional-${inputName}`}
      className="text-sm text-muted-foreground cursor-pointer select-none"
    >
      Set as optional
    </label>
  </div>
);

const TypeField = ({
  inputValue,
  onInputChange,
  onBlur,
  placeholder,
  disabled,
  inputName,
}: {
  inputValue: string;
  onInputChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  disabled?: boolean;
  inputName: string;
}) => (
  <FormField label="Type" id={`input-type-${inputName}`}>
    <Input
      id={`input-type-${inputName}`}
      value={inputValue}
      onChange={(e) => onInputChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className="text-sm"
    />
  </FormField>
);

export { NameField, OptionalField, TextField, TypeField };
