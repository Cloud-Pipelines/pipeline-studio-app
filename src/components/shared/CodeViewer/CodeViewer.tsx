import { Maximize2, X as XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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

function useTrackingHash(
  hash: string | undefined,
  onHashChange: (oldHash: string | undefined, newHash: string) => void,
) {
  const hashRef = useRef(hash);

  useEffect(() => {
    const handleHashChange = (event: HashChangeEvent) => {
      const newUrl = new URL(event.newURL);

      if (hashRef.current !== newUrl.hash) {
        onHashChange(hashRef.current, newUrl.hash);
        hashRef.current = newUrl.hash;
      }
    };

    if (hash === hashRef.current) {
      return;
    }

    hashRef.current = hash;

    const url = new URL(window.location.href);
    url.hash = hash ?? "";

    /**
     * We dont want to block the main thread immediately (due to tanstack router),
     * so scheduling for next event loop improves perceived performance
     */
    setTimeout(() => window.history.pushState({}, "", url.toString()));

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [hash, onHashChange]);
}

const CodeViewer = ({
  code,
  language = "yaml",
  filename = "",
}: CodeViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleEnterFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleExitFullscreen = useCallback(
    (last: string | undefined, current: string | undefined) => {
      if (last === "#fullscreen") {
        setIsFullscreen(false);
      } else if (current === "#fullscreen") {
        setIsFullscreen(true);
      }
    },
    [],
  );

  useTrackingHash(
    isFullscreen ? "#fullscreen" : undefined,
    handleExitFullscreen,
  );

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

  return (
    <FullscreenElement fullscreen={isFullscreen}>
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
    </FullscreenElement>
  );
};

export default CodeViewer;
