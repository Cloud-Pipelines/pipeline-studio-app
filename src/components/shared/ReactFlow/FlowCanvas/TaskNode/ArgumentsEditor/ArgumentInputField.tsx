/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import {
  Delete,
  ListRestart,
  Lock,
  LockOpen,
  PlusSquare,
  UndoDot,
} from "lucide-react";
import { useMemo, useState } from "react";

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
  setArgument,
}: {
  argument: ArgumentInput;
  disabled?: boolean;
  setArgument: (value: ArgumentInput) => void;
}) => {
  const [inputValue, setInputValue] = useState(getInputValue(argument));

  const undoValue = useMemo(() => argument, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setArgument({ ...argument, value, isRemoved: false });
  };

  const handleLock = () => {
    const updatedArgument = {
      ...argument,
      isPrivate: !argument.isPrivate,
    };
    setArgument({ ...updatedArgument });
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

    setArgument(updatedArgument);
  };

  const handleReset = () => {
    const defaultValue = getDefaultValue(argument);

    setInputValue(defaultValue);
    setArgument({ ...argument, value: defaultValue });
  };

  const handleUndo = () => {
    setInputValue(getInputValue(undoValue));
    setArgument({ ...undoValue });
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
        <div
          className={cn(
            "bg-warning rounded-full h-1 w-1",
            !canUndo && "invisible",
          )}
        />
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
            className="text-xs text-gray-500 truncate"
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
              onChange={(e) => {
                handleInputChange(e.target.value);
              }}
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
                  "border-gray-100 text-gray-500",
              )}
              disabled={disabled}
            />
          </TooltipTrigger>
          {placeholder && !inputValue && (
            <TooltipContent className="z-9999">{placeholder}</TooltipContent>
          )}
        </Tooltip>
        {canUndo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleUndo}
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
                disabled={disabled}
                variant="ghost"
                style={{
                  paddingInline: "0.5rem",
                }}
              >
                <UndoDot className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="z-9999">Undo changes</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex gap-0 items-center w-1/5 justify-end ml-4">
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

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={handleLock}
              disabled={disabled}
              variant="ghost"
              size="icon"
              className={cn(argument.isPrivate && "bg-muted/50")}
            >
              {argument.isPrivate ? (
                <LockOpen className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {argument.isPrivate ? "Make public" : "Make private"}
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
