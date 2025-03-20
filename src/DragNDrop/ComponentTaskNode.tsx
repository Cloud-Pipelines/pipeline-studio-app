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
import {
  CircleCheck,
  CircleAlert,
  RefreshCcw,
  EyeIcon,
  CircleDashed,
} from "lucide-react";

import ArgumentsEditorDialog from "./ArgumentsEditorDialog";

const inputHandlePosition = Position.Top;
const outputHandlePosition = Position.Bottom;

type InputOrOutputSpec = InputSpec | OutputSpec;

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
    const ioTypeName = ioSpec.type?.toString() ?? "Any";
    let classNames = [`handle_${idPrefix}${ioTypeName}`.replace(/ /g, "_")];

    let tailwindClasses = "w-2! h-2! border-2! rounded-full! ";

    const isInvalid = (inputsWithMissingArguments ?? []).includes(ioSpec.name);
    if (isInvalid) {
      tailwindClasses += "border-rose-500! bg-rose-50! ";
    } else {
      tailwindClasses += "bg-white! border-slate-300! hover:border-slate-600! ";
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
        className={`${classNames.join(" ")} ${tailwindClasses}`}
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
  let labelClasses = "label";

  if (position === Position.Top || position === Position.Bottom) {
    if (numHandles > 1) {
      maxLabelWidthPx = NODE_WIDTH_IN_PX / (numHandles + 1);
    }
    if (maxLabelWidthPx < 35) {
      maxLabelWidthPx = 50;
      labelClasses += " label-angled";
    }
  } else {
    maxLabelWidthPx = 60;
  }

  labelClasses += " truncate text-xs";

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
      return <CircleCheck className="w-3.5 h-3.5 text-emerald-500" />;
    case "FAILED":
    case "SYSTEM_ERROR":
    case "INVALID":
    case "UPSTREAM_FAILED":
    case "UPSTREAM_FAILED_OR_SKIPPED":
      return <CircleAlert className="w-3.5 h-3.5 text-rose-500" />;
    case "RUNNING":
    case "STARTING":
    case "CANCELLING":
      return <RefreshCcw className="w-3.5 h-3.5 text-sky-500 animate-spin" />;
    case "CONDITIONALLY_SKIPPED":
    case "CANCELLED":
      return <EyeIcon className="w-3.5 h-3.5 text-slate-500" />;
    default:
      return <CircleDashed className="w-3.5 h-3.5 text-slate-400" />;
  }
};

const ComponentTaskNode = ({ data }: NodeProps) => {
  const [isArgumentsEditorOpen, setIsArgumentsEditorOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const typedData = data as ComponentTaskNodeProps;
  const taskSpec = typedData.taskSpec;
  const componentSpec = taskSpec.componentRef.spec;

  const runStatus = taskSpec.annotations?.["status"] as string | undefined;
  // for testing can we assign a status to the node randomly
  // const runStatus = ["SUCCEEDED", "FAILED", "RUNNING", "STARTING", "CANCELLING", "CONDITIONALLY_SKIPPED", "CANCELLED", "SYSTEM_ERROR", "INVALID", "UPSTREAM_FAILED", "UPSTREAM_FAILED_OR_SKIPPED"][Math.floor(Math.random() * 10)];

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

  const getBorderColor = () => {
    switch (runStatus) {
      case "SUCCEEDED":
        return "border-emerald-500";
      case "FAILED":
      case "SYSTEM_ERROR":
      case "INVALID":
      case "UPSTREAM_FAILED":
      case "UPSTREAM_FAILED_OR_SKIPPED":
        return "border-rose-500";
      case "RUNNING":
      case "STARTING":
      case "CANCELLING":
        return "border-sky-500";
      default:
        return isHovered ? "border-slate-400" : "border-slate-300";
    }
  };

  const getBgColor = () => {
    switch (runStatus) {
      case "SUCCEEDED":
        return "bg-emerald-50";
      case "FAILED":
      case "SYSTEM_ERROR":
      case "INVALID":
      case "UPSTREAM_FAILED":
      case "UPSTREAM_FAILED_OR_SKIPPED":
        return "bg-rose-50";
      case "RUNNING":
      case "STARTING":
      case "CANCELLING":
        return "bg-sky-50";
      default:
        return "bg-white";
    }
  };

  return (
    <>
      <div
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`border rounded-md shadow-sm transition-all duration-200 ${getBorderColor()} ${getBgColor()}`}
        style={{ width: `${NODE_WIDTH_IN_PX}px` }}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="font-medium text-gray-800 truncate " title={title}>
            {label}
          </div>

          {runStatus && (
            <div className="flex items-center ml-2 flex-shrink-0">
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
