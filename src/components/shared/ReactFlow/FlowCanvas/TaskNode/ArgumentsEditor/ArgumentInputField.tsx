/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { Delete, ListRestart, PlusSquare } from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ArgumentInput } from "@/types/arguments";
import type { ArgumentType, TypeSpecType } from "@/utils/componentSpec";

export const ArgumentInputField = ({
  argument,
  disabled = false,
  onSave,
}: {
  argument: ArgumentInput;
  disabled?: boolean;
  onSave: (argument: ArgumentInput) => void;
}) => {
  const [inputValue, setInputValue] = useState(getInputValue(argument) ?? "");

  const undoValue = useMemo(() => argument, []);

  const handleInputChange = (e: ChangeEvent) => {
    const value = (e.target as HTMLInputElement).value;
    setInputValue(value);
  };

  const handleBlur = () => {
    const updatedArgument = {
      ...argument,
      value: inputValue.trim(),
    };

    onSave(updatedArgument);
  };

  const handleRemove = () => {
    const updatedArgument = {
      ...argument,
      isRemoved: !argument.isRemoved,
    };

    if (!updatedArgument.isRemoved && updatedArgument.value === "") {
      const defaultValue = getDefaultValue(updatedArgument);

      updatedArgument.value = defaultValue;

      setInputValue(defaultValue);
    }

    onSave(updatedArgument);
  };

  const handleReset = () => {
    const defaultValue = getDefaultValue(argument);

    setInputValue(defaultValue);
    onSave({ ...argument, value: defaultValue });
  };

  const handleUndo = () => {
    if (disabled) return;

    setInputValue(getInputValue(undoValue) ?? "");
    onSave({ ...undoValue });
  };

  const canUndo = useMemo(
    () => JSON.stringify(argument) !== JSON.stringify(undoValue),
    [argument, undoValue],
  );

  const placeholder = useMemo(() => {
    if (argument.inputSpec.default !== undefined) {
      return argument.inputSpec.default;
    }

    if (argument.isRemoved) {
      return "";
    }

    return getPlaceholder(argument.value);
  }, [argument]);

  return (
    <div className="flex w-full items-center justify-between gap-2 py-1">
      <div className="flex items-center gap-2 w-2/5">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "bg-success rounded-full h-2 w-2 cursor-pointer",
                !canUndo && "invisible",
                disabled && "opacity-50",
              )}
              onClick={handleUndo}
            />
          </TooltipTrigger>
          <TooltipContent className="z-9999">Recently changed</TooltipContent>
        </Tooltip>
        <div
          className={cn("flex flex-col", argument.isRemoved && "opacity-50")}
        >
          <Label
            htmlFor={argument.inputSpec.name}
            className="text-sm break-words"
          >
            {argument.inputSpec.name.replace(/_/g, " ")}
          </Label>
          <span
            className="text-xs text-muted-foreground truncate"
            title={typeSpecToString(argument.inputSpec.type)}
          >
            ({typeSpecToString(argument.inputSpec.type)}
            {!argument.inputSpec.optional ? "*" : ""})
          </span>
        </div>
      </div>
      <div className="relative w-48">
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              id={argument.inputSpec.name}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              required={!argument.inputSpec.optional}
              className={cn(
                "flex-1",
                canUndo && "pr-10",
                argument.isRemoved &&
                  !argument.inputSpec.optional &&
                  "border-red-200",
                argument.isRemoved &&
                  argument.inputSpec.optional &&
                  "border-gray-100 text-muted-foreground",
              )}
              disabled={disabled}
            />
          </TooltipTrigger>
          {placeholder && !inputValue && (
            <TooltipContent className="z-9999">{placeholder}</TooltipContent>
          )}
        </Tooltip>
      </div>

      <div className="flex gap-1 items-center w-1/5 justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              variant="ghost"
              size="icon"
            >
              {argument.isRemoved ? (
                <PlusSquare className="h-4 w-4" />
              ) : (
                <Delete className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="z-9999">
            {argument.isRemoved ? "Include Argument" : "Exclude Argument"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={handleReset}
              className={cn(argument.isRemoved ? "invisible" : "")}
              disabled={
                disabled ||
                argument.isRemoved ||
                argument.value === getDefaultValue(argument)
              }
              variant="ghost"
              size="icon"
            >
              <ListRestart className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            className={cn("z-9999", argument.isRemoved ? "invisible" : "")}
          >
            Reset to Default
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

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

const getInputValue = (argumentInput: ArgumentInput) => {
  const argument = argumentInput.value;

  if (argument === undefined) {
    return argumentInput.inputSpec.default;
  }

  if (typeof argument === "string") {
    return argument;
  }

  return "";
};

const getDefaultValue = (argumentInput: ArgumentInput) => {
  return argumentInput.inputSpec.default ?? "";
};
