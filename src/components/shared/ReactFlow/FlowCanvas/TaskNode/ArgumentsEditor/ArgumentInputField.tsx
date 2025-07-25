/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import {
  Delete,
  HelpCircle,
  Info,
  ListRestart,
  PlusSquare,
} from "lucide-react";
import {
  type ChangeEvent,
  type MouseEvent,
  useCallback,
  useMemo,
  useState,
} from "react";

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
  const [showDescription, setShowDescription] = useState(false);
  const [lastSubmittedValue, setLastSubmittedValue] = useState<string>(
    getInputValue(argument) ?? "",
  );

  const undoValue = useMemo(() => argument, [argument]);
  const hint = argument.inputSpec.annotations?.hint as string | undefined;

  const handleInputChange = (e: ChangeEvent) => {
    const value = (e.target as HTMLInputElement).value;
    setInputValue(value);
  };

  const handleBlur = () => {
    const value = inputValue.trim();

    const updatedArgument = {
      ...argument,
      value,
      isRemoved: value === lastSubmittedValue ? argument.isRemoved : false,
    };

    onSave(updatedArgument);
    setLastSubmittedValue(value);
  };

  const handleRemove = () => {
    const updatedArgument = {
      ...argument,
      value: inputValue.trim(),
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

  const handleUndo = (e: MouseEvent) => {
    e.stopPropagation();

    if (disabled) return;

    setInputValue(getInputValue(undoValue) ?? "");
    onSave({ ...undoValue });
  };

  const handleBackgroundClick = useCallback((e: MouseEvent) => {
    // Prevent toggling description if a child input or button is clicked
    const target = e.target as HTMLElement;
    if (
      target.closest("input") ||
      target.closest("button") ||
      target.closest("[role=button]")
    ) {
      return;
    }
    e.stopPropagation();
    setShowDescription((prev) => !prev);
  }, []);

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
    <div className="relative w-full flex-col gap-2">
      <div
        className="flex w-full items-center justify-between gap-2 py-1 rounded-md hover:bg-secondary/70 cursor-pointer"
        onClick={handleBackgroundClick}
      >
        <div className="flex items-center gap-2 justify-between w-40 pr-2">
          <div className="flex items-center gap-2">
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
              <TooltipContent className="z-9999">
                Recently changed
              </TooltipContent>
            </Tooltip>
            <div
              className={cn(
                "flex flex-col",
                argument.isRemoved && "opacity-50",
              )}
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
          {!!hint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent className="z-9999">{hint}</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="relative min-w-24 grow">
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
                  argument.isRemoved && "opacity-50 focus:opacity-100",
                )}
                disabled={disabled}
              />
            </TooltipTrigger>
            {placeholder && !inputValue && (
              <TooltipContent className="z-9999">{placeholder}</TooltipContent>
            )}
          </Tooltip>
        </div>

        <div className="flex gap-1 items-center w-24 justify-end">
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
      {showDescription && (
        <div className="z-50 bg-gray-50 text-secondary-foreground p-2 rounded-md w-full mb-2">
          <p className="text-sm">
            <Info className="h-4 w-4 inline-block mr-2" />
            {argument.inputSpec.description ?? "No description provided."}
          </p>
        </div>
      )}
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
