/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import type { DragEvent } from "react";

import type { ComponentReference, TaskSpec } from "../componentSpec";

const onDragStart = (event: DragEvent, nodeData: object) => {
  event.dataTransfer.setData("application/reactflow", JSON.stringify(nodeData));
  event.dataTransfer.setData(
    "DragStart.offset",
    JSON.stringify({
      offsetX: event.nativeEvent.offsetX,
      offsetY: event.nativeEvent.offsetY,
    })
  );
  event.dataTransfer.effectAllowed = "move";
};

interface DraggableComponentProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  componentReference: ComponentReference;
}

const DraggableComponent = ({
  componentReference,
  ...props
}: DraggableComponentProps) => {
  let title = componentReference.spec?.name || "";
  if (componentReference.url) {
    title += "\nUrl: " + componentReference.url;
  }
  if (componentReference.digest) {
    title += "\nDigest: " + componentReference.digest;
  }
  if (componentReference.spec?.description) {
    title += "\nDescription: " + componentReference.spec?.description;
  }
  return (
    <div
      className="react-flow__node react-flow__node-task sidebar-node"
      draggable
      onDragStart={(event: DragEvent) => {
        const taskSpec: TaskSpec = {
          componentRef: componentReference,
        };
        return onDragStart(event, { task: taskSpec });
      }}
      title={title}
      {...props}
    >
      {componentReference.spec?.name ?? "Component"}
    </div>
  );
};

export default DraggableComponent;
