/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { type CSSProperties, memo, useState } from "react";

import type {
  ArgumentType,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from "../componentSpec";

import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps, HandleType } from "@xyflow/react";
import { CircleCheck, CircleAlert, RefreshCcw, EyeIcon } from "lucide-react";

import ArgumentsEditorDialog from "./ArgumentsEditorDialog";

const inputHandlePosition = Position.Top;
const outputHandlePosition = Position.Bottom;

type InputOrOutputSpec = InputSpec | OutputSpec;

const MISSING_ARGUMENT_CLASS_NAME = "missing-argument";

const NODE_WIDTH_IN_PX = 180;

export const isComponentTaskNode = (
  node: Node,
): node is Node<ComponentTaskNodeProps> =>
  node.type === "task" &&
  node.data !== undefined &&
  "taskSpec" in node.data &&
  "taskId" in node.data;

function generateHandles(
  ioSpecs: InputOrOutputSpec[],
  handleType: HandleType,
  position: Position,
  idPrefix: string,
  inputsWithMissingArguments?: string[],
): React.ReactElement[] {
  const handleComponents = [];
  const numHandles = ioSpecs.length;
  for (let i = 0; i < numHandles; i++) {
    const ioSpec = ioSpecs[i];
    const id = idPrefix + ioSpec.name;
    const relativePosition = (i + 1) / (numHandles + 1);
    const positionPercentString = String(100 * relativePosition) + "%";
    const style =
      position === Position.Top || position === Position.Bottom
        ? { left: positionPercentString }
        : { top: positionPercentString };
    // TODO: Handle complex type specs
    const ioTypeName = ioSpec.type?.toString() ?? "Any";
    let classNames = [`handle_${idPrefix}${ioTypeName}`.replace(/ /g, "_")];
    const isInvalid = (inputsWithMissingArguments ?? []).includes(ioSpec.name);
    if (isInvalid) {
      classNames.push(MISSING_ARGUMENT_CLASS_NAME);
    }
    classNames = classNames.map((className) => className.replace(/ /g, "_"));

    const [labelClasses, labelStyle] = generateLabelStyle(position, numHandles);
    const handleTitle =
      ioSpec.name + " : " + ioTypeName + "\n" + (ioSpec.description || "");
    handleComponents.push(
      <Handle
        key={id}
        type={handleType}
        position={position}
        id={id}
        style={style}
        isConnectable={true}
        title={handleTitle}
        className={classNames.join(" ")}
      >
        <div className={labelClasses} style={labelStyle}>
          {ioSpec.name}
        </div>
      </Handle>,
    );
  }
  return handleComponents;
}

function generateLabelStyle(
  position: Position,
  numHandles: number,
): [string, CSSProperties] {
  let maxLabelWidthPx = NODE_WIDTH_IN_PX;
  // By default, we want to place the label on the same side of the handle as the handle is on the side of the node.
  let labelClasses = "label";
  // When there are too many inputs/outputs, we need to move the label so it starts from the handle.
  // Based on my tests, we always want this for >4 handles (top/bottom), so the rotated default placement is never used at all.

  if (position === Position.Top || position === Position.Bottom) {
    if (numHandles > 1) {
      // For single handle max width is the node width, while the formula would give half of that
      maxLabelWidthPx = NODE_WIDTH_IN_PX / (numHandles + 1);
    }
    //if (numHandles > 4) {
    if (maxLabelWidthPx < 35) {
      maxLabelWidthPx = 50;
      labelClasses += " label-angled";
    }
  } else {
    maxLabelWidthPx = 60;
  }

  const labelStyle: CSSProperties = { maxWidth: `${maxLabelWidthPx}px` };
  return [labelClasses, labelStyle];
}

function generateInputHandles(
  inputSpecs: InputSpec[],
  inputsWithInvalidArguments?: string[],
): React.ReactElement[] {
  return generateHandles(
    inputSpecs,
    "target",
    inputHandlePosition,
    "input_",
    inputsWithInvalidArguments,
  );
}

function generateOutputHandles(
  outputSpecs: OutputSpec[],
): React.ReactElement[] {
  return generateHandles(
    outputSpecs,
    "source",
    outputHandlePosition,
    "output_",
  );
}

export interface ComponentTaskNodeProps extends Record<string, unknown> {
  taskSpec: TaskSpec;
  taskId: string;
  setArguments?: (args: Record<string, ArgumentType>) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "SUCCEEDED":
      return <CircleCheck className="w-4 h-4 text-green-500" />;
    case "FAILED":
    case "SYSTEM_ERROR":
    case "INVALID":
    case "UPSTREAM_FAILED":
    case "UPSTREAM_FAILED_OR_SKIPPED":
      return <CircleAlert className="w-4 h-4 text-red-500" />;
    case "RUNNING":
    case "STARTING":
    case "CANCELLING":
      return <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin" />;
    case "CONDITIONALLY_SKIPPED":
    case "CANCELLED":
      return <EyeIcon className="w-4 h-4 text-gray-500" />;
    default:
      return null;
  }
};

const ComponentTaskNode = ({ data }: NodeProps) => {
  const [isArgumentsEditorOpen, setIsArgumentsEditorOpen] = useState(false);

  const typedData = data as ComponentTaskNodeProps;
  const taskSpec = typedData.taskSpec;
  const componentSpec = taskSpec.componentRef.spec;

  const runStatus = taskSpec.annotations?.["status"] as string | undefined;

  if (componentSpec === undefined) {
    return <></>;
  }

  const label = componentSpec.name ?? "<component>";
  let title = "Task ID: " + typedData.taskId;
  if (componentSpec.name) {
    title += "\nComponent: " + componentSpec.name;
  }
  if (taskSpec.componentRef.url) {
    title += "\nUrl: " + taskSpec.componentRef.url;
  }
  if (taskSpec.componentRef.digest) {
    title += "\nDigest: " + taskSpec.componentRef.digest;
  }
  if (componentSpec.description) {
    title += "\nDescription: " + componentSpec.description;
  }
  const inputsWithInvalidArguments = (componentSpec.inputs ?? [])
    .filter(
      (inputSpec) =>
        inputSpec.optional !== true &&
        inputSpec.default === undefined &&
        !(inputSpec.name in (taskSpec.arguments ?? {})),
    )
    .map((inputSpec) => inputSpec.name);
  const inputHandles = generateInputHandles(
    componentSpec.inputs ?? [],
    inputsWithInvalidArguments,
  );
  const outputHandles = generateOutputHandles(componentSpec.outputs ?? []);
  const handleComponents = inputHandles.concat(outputHandles);

  const closeArgumentsEditor = () => {
    setIsArgumentsEditorOpen(false);
  };

  const handleDoubleClick = () => {
    if (!isArgumentsEditorOpen) {
      setIsArgumentsEditorOpen(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return "bg-green-100 text-green-800 border-green-300";
      case "FAILED":
      case "SYSTEM_ERROR":
      case "INVALID":
      case "UPSTREAM_FAILED":
      case "UPSTREAM_FAILED_OR_SKIPPED":
        return "bg-red-100 text-red-800 border-red-300";
      case "RUNNING":
      case "STARTING":
      case "CANCELLING":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "CONDITIONALLY_SKIPPED":
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <>
      <div onDoubleClick={handleDoubleClick}>
        <div className="p-4 flex flex-row items-center justify-between gap-2">
          <div className="font-medium truncate flex-grow" title={title}>
            {label}
          </div>
          {runStatus && (
            <div
              className={`text-xs  p-2 rounded-md border flex items-center justify-center ${getStatusColor(runStatus)}`}
            >
              {getStatusIcon(runStatus)}
            </div>
          )}
        </div>
      </div>
      {handleComponents}
      {isArgumentsEditorOpen && !runStatus && (
        <ArgumentsEditorDialog
          taskSpec={taskSpec}
          closeEditor={closeArgumentsEditor}
          setArguments={typedData.setArguments}
        />
      )}
    </>
  );
};

export default memo(ComponentTaskNode);
