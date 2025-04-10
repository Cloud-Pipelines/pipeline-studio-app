/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { CircleX } from "lucide-react";
import { type DragEvent, type MouseEvent } from "react";

import CondensedUrl from "@/components/CondensedUrl";
import ConfirmationDialog from "@/components/ConfirmationDialog";

import type { ComponentReference, TaskSpec } from "../componentSpec";

const onDragStart = (event: DragEvent, nodeData: object) => {
  event.dataTransfer.setData("application/reactflow", JSON.stringify(nodeData));
  event.dataTransfer.setData(
    "DragStart.offset",
    JSON.stringify({
      offsetX: event.nativeEvent.offsetX,
      offsetY: event.nativeEvent.offsetY,
    }),
  );
  event.dataTransfer.effectAllowed = "move";
};

interface DraggableComponentProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  componentReference: ComponentReference;
  onDelete?: (e: MouseEvent) => void;
}

const DraggableComponent = ({
  componentReference,
  onDelete,
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

  const name = componentReference.spec?.name ?? "Component";

  const handleConfirm = (e?: MouseEvent) => {
    if (e) {
      onDelete?.(e);
    }
  };

  const handleCancel = (e?: MouseEvent) => {
    e?.stopPropagation();
  };

  return (
    <>
      <div
        className="
      react-flow__node
      react-flow__node-task
      sidebar-node
      flex
      items-center
      justify-center
      border-2
      border-slate-300
      rounded-md
      min-h-10
      p-2
      text-center
      relative
      "
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
        <div className="flex flex-col items-center">
          <p>{name}</p>
          {componentReference.url && (
            <CondensedUrl
              url={componentReference.url}
              className="text-[0.5625rem]"
            />
          )}
        </div>
        {onDelete && (
          <ConfirmationDialog
            title={`Delete ${name}?`}
            description={`'${name}' is a custom user component. This action cannot be undone.`}
            trigger={
              <div className="absolute top-0.5 right-0.5 cursor-pointer">
                <CircleX className="size-4 text-red-500" />
              </div>
            }
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </div>
    </>
  );
};

export default DraggableComponent;
