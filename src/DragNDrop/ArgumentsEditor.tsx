/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ArgumentType, InputSpec, TypeSpecType } from "../componentSpec";

interface ArgumentsEditorProps {
  inputs: InputSpec[];
  componentArguments: Record<string, ArgumentType>;
  setComponentArguments: (args: Record<string, ArgumentType>) => void;
  shrinkToWidth?: boolean;
  disabled?: boolean;
}

const typeSpecToString = (typeSpec?: TypeSpecType): string => {
  if (typeSpec === undefined) {
    return "Any";
  }
  if (typeof typeSpec === "string") {
    return typeSpec;
  }
  return JSON.stringify(typeSpec);
};

const getPlaceholder = (argument: ArgumentType) => {
  if (typeof argument === "string" || !argument) {
    return "";
  }

  if (argument && "taskOutput" in argument) {
    return `<from task ${argument.taskOutput.taskId} / ${argument.taskOutput.outputName}>`;
  }
  if (argument && "graphInput" in argument) {
    return `<from graph input ${argument.graphInput.inputName}>`;
  }
  return "<reference>";
};

const getInputValue = (argument: ArgumentType, inputSpec: InputSpec) => {
  if (argument === undefined) {
    return inputSpec.default;
  }

  if (typeof argument === "string") {
    return argument;
  }
  return "";
};

const ArgumentInput = ({
  input,
  componentArguments,
  setComponentArguments,
  disabled = false,
}: {
  input: InputSpec;
  componentArguments: Record<string, ArgumentType>;
  setComponentArguments: (input: InputSpec, value: string) => void;
  disabled?: boolean;
}) => {
  const [inputValue, setInputValue] = useState(
    getInputValue(componentArguments[input.name], input),
  );

  useEffect(() => {
    const nextValue = inputValue ?? "";
    setComponentArguments(input, nextValue);
  }, [inputValue]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleRemove = () => {
    if (input.default) {
      setInputValue(input.default);
    } else {
      setInputValue("");
    }
  };

  return (
    <div className="flex w-full items-center gap-2 py-1">
      <div className="w-[300px] min-w-[300px] flex flex-col">
        <Label htmlFor={input.name} className="text-sm break-words">
          {input.name.replace(/_/g, " ")}
        </Label>
        <span
          className="text-xs text-gray-500 truncate"
          title={typeSpecToString(input.type)}
        >
          ({typeSpecToString(input.type)}
          {!input.optional ? "*" : ""})
        </span>
      </div>
      <Input
        id={input.name}
        value={inputValue}
        onChange={(e) => {
          handleInputChange(e.target.value);
        }}
        placeholder={getPlaceholder(componentArguments[input.name])}
        required={!input.optional}
        className="flex-1"
        disabled={disabled}
      />
      <Button
        type="button"
        onClick={handleRemove}
        className="w-[40px] min-w-[40px]"
        disabled={disabled}
      >
        ⌧
      </Button>
    </div>
  );
};

const ArgumentsEditor = ({
  inputs,
  componentArguments,
  setComponentArguments,
  disabled = false,
}: ArgumentsEditorProps) => {
  const handleInputChange = (input: InputSpec, value: string) => {
    setComponentArguments({
      ...componentArguments,
      [input.name]: value,
    });
  };

  return (
    <div className="h-auto w-[650px] flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-4">
      {inputs.map((input) => {
        return (
          <ArgumentInput
            key={input.name}
            input={input}
            componentArguments={componentArguments}
            setComponentArguments={handleInputChange}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
};

export default ArgumentsEditor;
