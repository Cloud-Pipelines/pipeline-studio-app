import { useState } from "react";

import type { InputSpec, TypeSpecType } from "@/utils/componentSpec";

import { NameField, TypeField, ValueField } from "./FormFields";
import { getTypeMapping } from "./utils";

interface InputValueEditorProps {
  input: InputSpec;
  onValueChange: (inputName: string, value: string) => void;
  onTypeChange?: (inputName: string, type: TypeSpecType) => void;
  onNameChange?: (oldName: string, newName: string) => void;
  disabled?: boolean;
}

export const InputValueEditor = ({
  input,
  onValueChange,
  onTypeChange,
  onNameChange,
  disabled = false,
}: InputValueEditorProps) => {
  const [inputValue, setInputValue] = useState(input.value || "");
  const [inputName, setInputName] = useState(input.name);

  const { inputType, commonType } = getTypeMapping(input.type);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputName(e.target.value);
  };

  const handleBlur = () => onValueChange(input.name, inputValue);

  const handleNameBlur = () => {
    onNameChange?.(input.name, inputName);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleTypeChange = (newType: string) => {
    onTypeChange?.(input.name, newType);
  };

  const placeholder = input.default || `Enter ${input.name}...`;

  return (
    <div className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex gap-4">
        <div className="flex-1">
          <NameField
            inputName={inputName}
            onNameChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="w-36">
          <TypeField
            commonType={commonType}
            onTypeChange={handleTypeChange}
            inputName={input.name}
          />
        </div>
      </div>

      <ValueField
        inputType={inputType}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        inputName={input.name}
      />

      {input.description && (
        <div className="text-xs text-gray-500 mt-1">{input.description}</div>
      )}
    </div>
  );
};
