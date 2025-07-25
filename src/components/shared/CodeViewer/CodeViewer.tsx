import { Maximize2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { getLineHeight } from "@/utils/string";

import CodeSyntaxHighlighter from "./CodeSyntaxHighlighter";
import { useFullscreen } from "./FullscreenCodeViewer";

interface CodeViewerProps {
  code: string;
  language?: string;
  title?: string;
  filename?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const CodeViewer = ({
  code,
  language = "yaml",
  title = "Code Implementation",
  filename = "",
  onFullscreenChange = () => {},
}: CodeViewerProps) => {
  const { openFullscreen } = useFullscreen();

  const handleEnterFullscreen = useCallback(() => {
    openFullscreen({ code, language, title });
    onFullscreenChange(true);
  }, [code, language, title, openFullscreen, onFullscreenChange]);

  const isLarge = code.split("\n").length > 500;

  const syntaxHighlighter = useMemo(
    () =>
      isLarge ? (
        <WindowedCodeViewer
          code={code}
          language={language}
          fontSize="0.75rem"
        />
      ) : (
        <div
          className="absolute inset-0 overflow-y-auto bg-slate-900"
          style={{ willChange: "transform", minHeight: DEFAULT_HEIGHT }}
        >
          <CodeSyntaxHighlighter
            code={code}
            language={language}
            height="calc(100% - 48px)"
            fontSize="0.75rem"
          />
        </div>
      ),
    [code, isLarge, language],
  );

  return (
    <div className="border rounded-md h-full bg-slate-900 flex flex-col">
      <div className="flex justify-between items-center p-2 sticky top-0 z-10 bg-slate-800">
        <h3 className="text-secondary font-medium ml-2">
          {filename} <span className="text-sm">(Read Only)</span>
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEnterFullscreen}
          className="text-gray-300 hover:text-slate-800"
          title="View fullscreen"
        >
          <Maximize2 className="size-4" />
        </Button>
      </div>
      <div className="flex-1 relative">{syntaxHighlighter}</div>
    </div>
  );
};

/*
 * A basic Window/Virtualizer implementation for large code files
 * It will only render the lines of code that the user is looking at, rather than the entire file
 * */
const DEFAULT_HEIGHT = 128;
const WindowedCodeViewer = ({
  code,
  language = "yaml",
  fontSize = "0.75rem",
}: CodeViewerProps & { fontSize?: string }) => {
  const lines = useMemo(() => code.split("\n"), [code]);
  const totalLines = lines.length;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(DEFAULT_HEIGHT);
  const [scrollTop, setScrollTop] = useState(0);

  // Measure container height using ResizeObserver
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const handleResize = () =>
      setContainerHeight(
        node.clientHeight > 0 ? node.clientHeight : DEFAULT_HEIGHT,
      );

    handleResize();
    let observer: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      observer = new ResizeObserver(handleResize);
      observer.observe(node);
    } else {
      window.addEventListener("resize", handleResize);
    }
    return () => {
      if (observer) observer.disconnect();
      else window.removeEventListener("resize", handleResize);
    };
  }, []);

  const lineHeight = useMemo(() => getLineHeight(fontSize), [fontSize]);

  const visibleLines = Math.max(1, Math.ceil(containerHeight / lineHeight));
  const overscan = 2;

  // Calculate which lines to render
  let startLine = Math.floor(scrollTop / lineHeight) - overscan;
  startLine = Math.max(0, startLine);
  let endLine = startLine + visibleLines + overscan * 2;
  endLine = Math.min(totalLines, endLine);

  const offsetY = startLine * lineHeight;
  const visibleCode = lines.slice(startLine, endLine).join("\n");

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="absolute inset-0 overflow-y-auto bg-slate-900"
      style={{ willChange: "transform", minHeight: DEFAULT_HEIGHT }}
    >
      <div style={{ height: totalLines * lineHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: offsetY,
            left: 0,
            right: 0,
            width: "100%",
          }}
        >
          <CodeSyntaxHighlighter
            code={visibleCode}
            language={language}
            fontSize={fontSize}
            startingLineNumber={startLine + 1}
            wrapLines={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;
