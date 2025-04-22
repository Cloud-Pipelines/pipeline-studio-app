/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { DndContext, type DragEndEvent, useDraggable } from "@dnd-kit/core";
import { CircleX, GripVertical } from "lucide-react";
import { type PropsWithChildren, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Global counter for z-index management
const MIN_Z_INDEX = 1000;
const globalZIndexCounter = (() => {
  let counter = MIN_Z_INDEX;
  let dialogsOpen = 0;
  return {
    decrement: () => --counter,
    increment: () => ++counter,
    get: () => counter,
    reset: () => (counter = MIN_Z_INDEX),

    addDialog: () => ++dialogsOpen,
    removeDialog: () => --dialogsOpen,
    countDialogs: () => dialogsOpen,
  };
})();

interface DraggableDialogProps extends PropsWithChildren {
  id: string;
  title: string;
  description: string;
  position?: { x: number; y: number };
  disabled?: boolean;
  secondaryActions?: ButtonProps[];
  onClose: () => void;
  onConfirm?: () => void;
}

const DraggableDialogPortal = ({
  id,
  title,
  description,
  position = { x: 100, y: 100 },
  disabled,
  secondaryActions,
  onClose,
  onConfirm,
  children,
}: DraggableDialogProps) => {
  const [dialogPosition, setDialogPosition] = useState(position);

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setDialogPosition({
      x: dialogPosition.x + delta.x,
      y: dialogPosition.y + delta.y,
    });
  };

  const dialog = (
    <DndContext onDragEnd={handleDragEnd}>
      <DraggableDialog
        id={id}
        title={title}
        description={description}
        position={dialogPosition}
        disabled={disabled}
        secondaryActions={secondaryActions}
        onClose={onClose}
        onConfirm={onConfirm}
      >
        {children}
      </DraggableDialog>
    </DndContext>
  );

  return createPortal(dialog, document.body);
};

const DraggableDialog = ({
  id,
  title,
  description,
  position = { x: 100, y: 100 },
  disabled,
  secondaryActions,
  onClose,
  onConfirm,
  children,
}: DraggableDialogProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });
  // Initialize with a unique z-index
  const [zIndex, setZIndex] = useState(() => globalZIndexCounter.increment());

  const bringToFront = () => {
    if (zIndex !== globalZIndexCounter.get()) {
      const newZIndex = globalZIndexCounter.increment();
      setZIndex(newZIndex);
    }
  };

  useEffect(() => {
    const currentZIndex = globalZIndexCounter.get();
    setZIndex(currentZIndex);
    globalZIndexCounter.addDialog();

    return () => {
      globalZIndexCounter.removeDialog();
      if (currentZIndex === globalZIndexCounter.get()) {
        globalZIndexCounter.decrement();
      }

      if (
        globalZIndexCounter.get() < MIN_Z_INDEX ||
        globalZIndexCounter.countDialogs() === 0
      ) {
        globalZIndexCounter.reset();
      }
    };
  }, []);

  const translateX = position.x + (transform?.x || 0);
  const translateY = position.y + (transform?.y || 0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

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
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
          <Button
            onClick={onClose}
            className="cursor-pointer absolute top-2 right-2"
            variant="ghost"
          >
            <CircleX />
          </Button>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            {secondaryActions &&
              secondaryActions.map((action, index) => (
                <Button key={index} {...action} />
              ))}
          </div>
          {onConfirm && (
            <Button
              onClick={onConfirm}
              disabled={disabled}
              className="cursor-pointer"
            >
              Apply
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default DraggableDialogPortal;
