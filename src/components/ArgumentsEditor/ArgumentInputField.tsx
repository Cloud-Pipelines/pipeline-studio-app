/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { Delete, ListRestart, PlusSquare, UndoDot } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type {
  ArgumentInput,
  ArgumentType,
  TypeSpecType,
} from "../../componentSpec";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const ArgumentInputField = ({
  argument,
  setArgument,
  disabled = false,
}: {
  argument: ArgumentInput;
  setArgument: (value: ArgumentInput) => void;
  disabled?: boolean;
}) => {
  const [inputValue, setInputValue] = useState(getInputValue(argument));
  const [hidePlaceholder, setHidePlaceholder] = useState(argument.linkedNode);

  const undoValue = useMemo(() => argument, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);

    const defaultValue = getDefaultValue(argument);

    setArgument({ ...argument, value, linkedNode: false });
    setHidePlaceholder(!!defaultValue.linkedNode);
  };

  const handleRemove = () => {
    const updatedArgument = {
      ...argument,
      isRemoved: !argument.isRemoved,
    };

    if (!updatedArgument.isRemoved && updatedArgument.value === "") {
      const defaultValue = getDefaultValue(updatedArgument);

      updatedArgument.value = defaultValue.value;
      updatedArgument.linkedNode = false;

      setInputValue(defaultValue.value);
      setHidePlaceholder(!!defaultValue.linkedNode);
    }

    setArgument(updatedArgument);
  };

  const handleReset = () => {
    const defaultValue = getDefaultValue(argument);

    setInputValue(defaultValue.value);

    setArgument({ ...argument, value: defaultValue.value, linkedNode: false });
    setHidePlaceholder(!!defaultValue.linkedNode);
  };

  const handleUndo = () => {
    setInputValue(getInputValue(undoValue));
    setHidePlaceholder(undoValue.linkedNode);
    setArgument({ ...undoValue });
  };

  const canUndo = useMemo(
    () => JSON.stringify(argument) !== JSON.stringify(undoValue),
    [argument, undoValue],
  );

  return (
    <div className="flex w-full items-center gap-2 py-1">
      <div
        className={cn(
          "w-[256px] min-w-[256px] flex flex-col",
          argument.isRemoved ? "opacity-50" : "",
        )}
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
      <div className="flex flex-1 items-center relative">
        <Input
          id={argument.inputSpec.name}
          value={inputValue}
          onChange={(e) => {
            handleInputChange(e.target.value);
          }}
          placeholder={
            hidePlaceholder ? getPlaceholder(argument.initialValue) : ""
          }
          required={!argument.inputSpec.optional}
          className={cn(
            "flex-1",
            canUndo && "pr-10",
            !argument.inputSpec.optional && argument.isRemoved
              ? "border-red-200"
              : "",
          )}
          disabled={disabled || argument.isRemoved}
        />
        {canUndo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleUndo}
                className="absolute right-1 text-xs h-min w-min p-1"
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

      <div className="flex gap-1 items-center">
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
                argument.value === getDefaultValue(argument).value
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
  const value = argumentInput.inputSpec.default ?? "";

  if (argumentInput.inputSpec.default === undefined) {
    return { value, linkedNode: false };
  }

  return { value, linkedNode: argumentInput.linkedNode };
};
