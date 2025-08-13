import { Maximize2, X as XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { FullscreenElement } from "../FullscreenElement";
import CodeSyntaxHighlighter from "./CodeSyntaxHighlighter";

interface CodeViewerProps {
  code: string;
  language?: string;
  title?: string;
  filename?: string;
}

const DEFAULT_HEIGHT = 128;

const CodeViewer = ({
  code,
  language = "yaml",
  filename = "",
}: CodeViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleEnterFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

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
            <CodeSyntaxHighlighter code={code} language={language} />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <FullscreenElement fullscreen={isFullscreen}>
      {codeViewer}
    </FullscreenElement>
  );
};

export default CodeViewer;
