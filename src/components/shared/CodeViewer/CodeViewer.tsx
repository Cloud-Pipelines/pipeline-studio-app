import { Maximize2, X as XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { FullscreenElement } from "../FullscreenElement";
import { useBetaFlagValue } from "../Settings/useBetaFlags";
import CodeSyntaxHighlighter from "./CodeSyntaxHighlighter";
import { useFullscreen } from "./FullscreenCodeViewer";

interface CodeViewerProps {
  code: string;
  language?: string;
  title?: string;
  filename?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const DEFAULT_HEIGHT = 128;

const CodeViewer = ({
  code,
  language = "yaml",
  title = "Code Implementation",
  filename = "",
  onFullscreenChange = () => {},
}: CodeViewerProps) => {
  const isVirtualized = useBetaFlagValue("codeViewer");
  const isFullscreenElement = useBetaFlagValue("fullscreen-code-viewer");

  const [isFullscreen, setIsFullscreen] = useState(false);

  const { openFullscreen } = useFullscreen();

  const handleEnterFullscreen = useCallback(() => {
    if (isFullscreenElement) {
      setIsFullscreen((prev) => !prev);
      onFullscreenChange(!isFullscreen);
    } else {
      openFullscreen({ code, language, title });
      onFullscreenChange(true);
    }
  }, [
    code,
    language,
    title,
    openFullscreen,
    onFullscreenChange,
    isFullscreenElement,
    isFullscreen,
  ]);

  // Handle Escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (isFullscreen && e.key === "Escape") {
        setIsFullscreen(false);
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isFullscreen]);

  const codeViewer = (
    <>
      <div className="h-full bg-slate-900 flex flex-col">
        <div className="flex justify-between items-center p-2 sticky top-0 z-10 bg-slate-800">
          <h3 className="text-secondary font-medium ml-2">
            {filename} <span className="text-sm">(Read Only)</span>
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEnterFullscreen}
            className="text-gray-300 hover:text-slate-800"
            title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            {isFullscreen ? (
              <XIcon className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
        </div>
        <div className="flex-1 relative">
          <div
            className="absolute inset-0 overflow-y-auto bg-slate-900"
            style={{ willChange: "transform", minHeight: DEFAULT_HEIGHT }}
          >
            <CodeSyntaxHighlighter
              code={code}
              language={language}
              height="calc(100% - 48px)"
              fontSize="0.75rem"
              virtualized={isVirtualized}
            />
          </div>
        </div>
      </div>
    </>
  );

  return isFullscreenElement ? (
    <FullscreenElement fullscreen={isFullscreen}>
      {codeViewer}
    </FullscreenElement>
  ) : (
    codeViewer
  );
};

export default CodeViewer;
