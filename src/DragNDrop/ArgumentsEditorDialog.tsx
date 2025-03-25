/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { DndContext, type DragEndEvent, useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { ArgumentType, ComponentSpec, TaskSpec } from "../componentSpec";
import ArgumentsEditor from "./ArgumentsEditor";

// Global counter for z-index management
let globalZIndexCounter = 1000;

interface ArgumentsEditorDialogProps {
  taskSpec: TaskSpec;
  closeEditor?: () => void;
  setArguments?: (args: Record<string, ArgumentType>) => void;
  position?: { x: number; y: number };
  disabled?: boolean;
}

const ArgumentsEditorDialog = ({
  taskSpec,
  closeEditor,
  setArguments,
  position = { x: 100, y: 100 },
  disabled = false,
}: ArgumentsEditorDialogProps) => {
  const [currentArguments, setCurrentArguments] = useState<
    Record<string, ArgumentType>
  >({ ...taskSpec.arguments });

  const [dialogPosition, setDialogPosition] = useState(position);
  // Initialize with a unique z-index
  const [currentZIndex, setCurrentZIndex] = useState(globalZIndexCounter);

  const componentSpec = taskSpec.componentRef.spec;
  if (componentSpec === undefined) {
    console.error(
      "ArgumentsEditor called with missing taskSpec.componentRef.spec",
      taskSpec,
    );
    return <></>;
  }

  const handleApply = () => {
    setArguments?.(currentArguments);
    closeEditor?.();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setDialogPosition({
      x: dialogPosition.x + delta.x,
      y: dialogPosition.y + delta.y,
    });
  };

  const bringToFront = () => {
    // Increment the global counter and use the new value
    globalZIndexCounter += 1;
    setCurrentZIndex(globalZIndexCounter);
  };

  const dialogContent = (
    <DndContext onDragEnd={handleDragEnd}>
      <DraggableDialogContent
        dialogPosition={dialogPosition}
        componentSpec={componentSpec}
        currentArguments={currentArguments}
        setCurrentArguments={setCurrentArguments}
        closeEditor={closeEditor ?? (() => {})}
        handleApply={handleApply}
        zIndex={currentZIndex}
        bringToFront={bringToFront}
        disabled={disabled}
      />
    </DndContext>
  );

  return createPortal(dialogContent, document.body);
};

const DraggableDialogContent = ({
  dialogPosition,
  componentSpec,
  currentArguments,
  setCurrentArguments,
  closeEditor,
  handleApply,
  zIndex,
  bringToFront,
  disabled,
}: {
  dialogPosition: { x: number; y: number };
  componentSpec: ComponentSpec;
  currentArguments: Record<string, ArgumentType>;
  setCurrentArguments: (args: Record<string, ArgumentType>) => void;
  closeEditor: () => void;
  handleApply: () => void;
  zIndex: number;
  bringToFront: () => void;
  disabled: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "arguments-dialog",
  });

  const translateX = dialogPosition.x + (transform?.x || 0);
  const translateY = dialogPosition.y + (transform?.y || 0);

  return (
    <div
      ref={setNodeRef}
      className="fixed top-0 left-0"
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
        zIndex: zIndex,
      }}
      onMouseDown={bringToFront}
    >
      <Card>
        <CardHeader>
          <CardTitle
            {...attributes}
            {...listeners}
            className="cursor-move flex items-center"
          >
            <GripVertical className="w-4 h-4 mr-2" />
            {componentSpec.name}
          </CardTitle>
          <CardDescription>
            Configure the component&apos;s input parameters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArgumentsEditor
            inputs={componentSpec.inputs ?? []}
            componentArguments={currentArguments}
            setComponentArguments={setCurrentArguments}
            disabled={disabled}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={closeEditor} className="cursor-pointer">
            Close
          </Button>
          <Button
            onClick={handleApply}
            disabled={disabled}
            className="cursor-pointer"
          >
            Apply
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ArgumentsEditorDialog;
