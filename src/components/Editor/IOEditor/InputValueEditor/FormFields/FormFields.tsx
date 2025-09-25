import type { icons } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FormFieldAction = {
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
      <InlineStack blockAlign="center" gap="1">
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
  autoFocus = false,
}: {
  inputName: string;
  onNameChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
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
      autoFocus={autoFocus}
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

export { NameField, TextField, TypeField };
