/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { type CSSProperties, memo, useState } from 'react';

import type{
  ArgumentType,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from '../componentSpec';

import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps, HandleType } from "@xyflow/react";

import ArgumentsEditorDialog from './ArgumentsEditorDialog';

const inputHandlePosition = Position.Top;
const outputHandlePosition = Position.Bottom;

type InputOrOutputSpec = InputSpec | OutputSpec;

const MISSING_ARGUMENT_CLASS_NAME = "missing-argument";

const NODE_WIDTH_IN_PX = 180;

export const isComponentTaskNode = (node: Node): node is Node<ComponentTaskNodeProps> =>
  node.type === "task" && node.data !== undefined && "taskSpec" in node.data && "taskId" in node.data;

function generateHandles(
  ioSpecs: InputOrOutputSpec[],
  handleType: HandleType,
  position: Position,
  idPrefix: string,
  inputsWithMissingArguments?: string[],
): React.ReactElement[] {
  let handleComponents = [];
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
      </Handle>
    );
  }
  return handleComponents;
}


function generateLabelStyle(
  position: Position,
  numHandles: number
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

function generateInputHandles(inputSpecs: InputSpec[], inputsWithInvalidArguments?: string[]): React.ReactElement[] {
  return generateHandles(inputSpecs, "target", inputHandlePosition, "input_", inputsWithInvalidArguments);
}

function generateOutputHandles(outputSpecs: OutputSpec[]): React.ReactElement[] {
  return generateHandles(outputSpecs, "source", outputHandlePosition, "output_");
}

export interface ComponentTaskNodeProps extends Record<string, unknown> {
  taskSpec: TaskSpec;
  taskId: string;
  setArguments?: (args: Record<string, ArgumentType>) => void;
}

const ComponentTaskNode = ({ data }: NodeProps) => {
  const [isArgumentsEditorOpen, setIsArgumentsEditorOpen] = useState(false);

  const typedData = data as ComponentTaskNodeProps;

  const taskSpec = typedData.taskSpec;
  const componentSpec = taskSpec.componentRef.spec;
  if (componentSpec === undefined) {
    return (<></>);
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
        !(inputSpec.name in (taskSpec.arguments ?? {}))
    )
    .map((inputSpec) => inputSpec.name);
  const inputHandles = generateInputHandles(componentSpec.inputs ?? [], inputsWithInvalidArguments);
  const outputHandles = generateOutputHandles(componentSpec.outputs ?? []);
  const handleComponents = inputHandles.concat(outputHandles);

  const closeArgumentsEditor = () => {
    setIsArgumentsEditorOpen(false);
  }

  return (
    <div
      onDoubleClick={() => {
        setIsArgumentsEditorOpen(!isArgumentsEditorOpen);
      }}
      title={title}
    >
      {label}
      {handleComponents}
      {isArgumentsEditorOpen && (
        <ArgumentsEditorDialog
          taskSpec={taskSpec}
          closeEditor={closeArgumentsEditor}
          setArguments={typedData.setArguments}
        />
      )}
    </div>
  );
};

export default memo(ComponentTaskNode);
