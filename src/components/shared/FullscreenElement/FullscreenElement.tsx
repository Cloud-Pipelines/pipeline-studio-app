import {
  type PropsWithChildren,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";

interface FullscreenElementProps extends PropsWithChildren {
  fullscreen: boolean;
  defaultMountElement: RefObject<HTMLElement | null>;
}

type FullscreenContainerStyles = Partial<
  Pick<
    CSSStyleDeclaration,
    | "position"
    | "top"
    | "left"
    | "zIndex"
    | "width"
    | "height"
    | "overflow"
    | "border"
    | "margin"
    | "padding"
    | "borderRadius"
    | "display"
  >
>;

function applyStyles(
  element: HTMLElement,
  styles: FullscreenContainerStyles,
): void {
  for (const [prop, value] of Object.entries(styles) as [
    keyof FullscreenContainerStyles,
    string,
  ][]) {
    if (!value) {
      element.style[prop] = "";
    } else {
      element.style[prop] = value;
    }
  }
}

function FullscreenElementPortal({
  children,
  fullscreen,
  defaultMountElement,
}: FullscreenElementProps) {
  const id = useRef(Math.random().toString(15).substring(2, 15));
  const containerElementRef = useRef<HTMLElement>(
    document.createElement("div"),
  );

  useEffect(() => {
    containerElementRef.current.style.pointerEvents = "all";

    if (fullscreen) {
      applyStyles(containerElementRef.current, {
        position: "fixed",
        top: "0",
        left: "0",
        zIndex: "2147483647",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        border: "none",
        margin: "0",
        padding: "0",
        borderRadius: "0",
        display: "block",
      });
      document.body.appendChild(containerElementRef.current);
    } else {
      applyStyles(containerElementRef.current, {
        position: "",
        top: "",
        left: "",
        zIndex: "",
        width: "",
        height: "",
        overflow: "",
        border: "",
        margin: "",
        padding: "",
        borderRadius: "",
        display: "contents",
      });

      if (defaultMountElement.current) {
        defaultMountElement.current.appendChild(containerElementRef.current);
      }
    }

    return () => {
      containerElementRef.current.remove();
    };
  }, [fullscreen, defaultMountElement]);

  const fragment = useMemo(() => <>{children}</>, [children]);

  return createPortal(fragment, containerElementRef.current, id.current);
}

export function FullscreenElement({
  children,
  fullscreen,
}: PropsWithChildren<{ fullscreen: boolean }>) {
  const mountRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={mountRef}
        data-testid="code-viewer-mount"
        style={{ display: "contents" }}
      ></div>
      <FullscreenElementPortal
        fullscreen={fullscreen}
        defaultMountElement={mountRef}
      >
        {children}
      </FullscreenElementPortal>
    </>
  );
}
