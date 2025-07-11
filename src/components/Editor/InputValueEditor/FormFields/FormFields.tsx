import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  error,
  disabled,
}: {
  inputName: string;
  onNameChange: (value: string) => void;
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
      className={`text-sm ${error ? "border-red-500 focus:border-red-500" : ""}`}
    />
    {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
  </FormField>
);

const TextField = ({
  inputValue,
  onInputChange,
  placeholder,
  disabled,
  inputName,
}: {
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  inputName: string;
}) => (
  <FormField label="Default Value" id={`input-value-${inputName}`}>
    <Textarea
      id={`input-value-${inputName}`}
      value={inputValue}
      onChange={(e) => onInputChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="text-sm"
    />
  </FormField>
);

const OptionalField = ({
  inputName,
  onInputChange,
  disabled = false,
  inputValue,
}: {
  inputName: string;
  onInputChange: (checked: boolean) => void;
  disabled?: boolean;
  inputValue: boolean;
}) => (
  <div className="flex items-center gap-2 mt-2">
    <Checkbox
      id={`input-optional-${inputName}`}
      checked={inputValue}
      onCheckedChange={onInputChange}
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
  placeholder,
  disabled,
  inputName,
}: {
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  inputName: string;
}) => (
  <FormField label="Type" id={`input-type-${inputName}`}>
    <Input
      id={`input-type-${inputName}`}
      value={inputValue}
      onChange={(e) => onInputChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="text-sm"
    />
  </FormField>
);
export { NameField, OptionalField, TextField, TypeField };
