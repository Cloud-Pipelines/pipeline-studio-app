import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { Button } from "./button";
import { Icon } from "./icon";

export type NotificationType = "success" | "error" | "info" | "warning";
export type NotificationPosition = "right" | "left" | "top" | "bottom";

interface PopupNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  content: React.ReactNode;
  type: NotificationType;
  position?: NotificationPosition;
}

export const PopupNotification = ({
  isOpen,
  onClose,
  triggerRef,
  content,
  type,
  position = "right",
}: PopupNotificationProps) => {
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  const notificationRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect();
      const notificationElement = notificationRef.current;

      let x = 0;
      let y = 0;

      switch (position) {
        case "right":
          x = triggerRect.right + 8;
          y = triggerRect.top;
          break;
        case "left":
          x = triggerRect.left - (notificationElement?.offsetWidth || 256) - 8;
          y = triggerRect.top;
          break;
        case "top":
          x = triggerRect.left;
          y = triggerRect.top - (notificationElement?.offsetHeight || 100) - 8;
          break;
        case "bottom":
          x = triggerRect.left;
          y = triggerRect.bottom + 8;
          break;
      }

      setCoordinates({ x, y });
    };

    updatePosition();

    // Update position on scroll/resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, position, triggerRef]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const getArrowClasses = () => {
    const baseArrow =
      "absolute w-0 h-0 border-4 border-transparent border-r-8 border-l-0 !border-y-transparent !border-l-transparent";
    const colorClasses = {
      success: "text-green-200 border-green-200",
      error: "text-red-200 border-red-200",
      info: "text-blue-200 border-blue-200",
      warning: "text-yellow-200 border-yellow-200",
    };
    const positionClasses = {
      right: "left-0 top-3",
      left: "right-0 top-3 rotate-180",
      top: "left-3 bottom-0 -rotate-90",
      bottom: "left-3 top-0 rotate-90",
    };

    return cn(baseArrow, colorClasses[type], positionClasses[position]);
  };

  const arrowClasses = getArrowClasses();

  return createPortal(
    <div
      ref={notificationRef}
      className="fixed z-[9999] min-w-64 max-w-80"
      style={{
        left: coordinates.x,
        top: coordinates.y,
      }}
    >
      <div className={arrowClasses} />

      <div
        className={cn(
          "absolute rounded-lg border shadow-lg p-3 animate-in fade-in-0 zoom-in-95 pr-7",
          type === "success" && "border-green-200 bg-green-50",
          type === "error" && "border-red-200 bg-red-50",
          type === "info" && "border-blue-200 bg-blue-50",
          type === "warning" && "border-yellow-200 bg-yellow-50",
          position === "right" && "left-2 slide-in-from-left-2",
          position === "left" && "right-2 slide-in-from-right-2",
          position === "top" && "bottom-2 slide-in-from-bottom-2",
          position === "bottom" && "top-2 slide-in-from-top-2",
        )}
      >
        <Button
          onClick={onClose}
          size="min"
          variant="ghost"
          className="absolute top-1 right-1 text-gray-500 hover:text-black p-1 hover:bg-transparent"
        >
          <Icon name="X" size="xs" />
        </Button>

        {content}
      </div>
    </div>,
    document.body,
  );
};
