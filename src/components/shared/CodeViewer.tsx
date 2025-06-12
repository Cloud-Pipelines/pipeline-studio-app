import { Maximize2, X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { Button } from "@/components/ui/button";
interface CodeContent {
  code: string;
  language: string;
  title: string;
}

interface FullscreenContextType {
  isAnyFullscreen: boolean;
  openFullscreen: (content: CodeContent) => void;
  closeFullscreen: () => void;
  currentContent: CodeContent | null;
}

interface FullscreenProviderProps {
  children: ReactNode;
}

interface CodeViewerProps {
  code: string;
  language?: string;
  title?: string;
  filename?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

interface FullscreenViewProps {
  content: CodeContent;
  onClose: () => void;
}

interface CodeSyntaxHighlighterProps {
  code: string;
  language: string;
  height?: string;
  fontSize?: string;
  padding?: string;
}

// Context
const FullscreenContext = createContext<FullscreenContextType>({
  isAnyFullscreen: false,
  openFullscreen: () => {},
  closeFullscreen: () => {},
  currentContent: null,
});

export const useFullscreen = () => useContext(FullscreenContext);

export const FullscreenProvider = ({ children }: FullscreenProviderProps) => {
  const [isAnyFullscreen, setIsAnyFullscreen] = useState(false);
  const [currentContent, setCurrentContent] = useState<CodeContent | null>(
    null,
  );

  const openFullscreen = useCallback((content: CodeContent) => {
    setCurrentContent(content);
    setIsAnyFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    if (window.history.state?.codeViewerFullscreen) {
      window.history.back();
    } else {
      setIsAnyFullscreen(false);
      setCurrentContent(null);
    }
  }, []);

  useEffect(() => {
    if (!isAnyFullscreen) return;

    // Escape key handler
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
    };

    // Popstate handler
    const handlePopState = () => {
      if (!window.history.state?.codeViewerFullscreen) {
        closeFullscreen();
      }
    };

    // Prevent background scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Push state if not already set
    if (!window.history.state?.codeViewerFullscreen) {
      window.history.pushState({ codeViewerFullscreen: true }, "");
    }

    window.addEventListener("keydown", handleEscapeKey);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscapeKey);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isAnyFullscreen, closeFullscreen]);

  const value = useMemo(
    () => ({
      isAnyFullscreen,
      openFullscreen,
      closeFullscreen,
      currentContent,
    }),
    [isAnyFullscreen, openFullscreen, closeFullscreen, currentContent],
  );

  return (
    <FullscreenContext.Provider value={value}>
      {children}
      {isAnyFullscreen && currentContent && (
        <FullscreenView content={currentContent} onClose={closeFullscreen} />
      )}
    </FullscreenContext.Provider>
  );
};

// Components
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

  return (
    <div className="border rounded-md h-full overflow-hidden hide-scrollbar bg-slate-900">
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
      <CodeSyntaxHighlighter
        code={code}
        language={language}
        height="calc(100% - 48px)"
        fontSize="0.75rem"
      />
    </div>
  );
};

const FullscreenView = ({ content, onClose }: FullscreenViewProps) => {
  const { code, language, title } = content;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-black/95 flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex justify-between items-center p-4 bg-slate-800">
        <h2 className="text-white font-medium">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-300 hover:text-slate-800"
          title="Close fullscreen view"
        >
          <X className="size-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <CodeSyntaxHighlighter
          code={code}
          language={language}
          fontSize="0.875rem"
          padding="1.5rem"
        />
      </div>
    </div>,
    document.body,
  );
};

const CodeSyntaxHighlighter = ({
  code,
  language,
  height = "100%",
  fontSize = "0.875rem",
  padding = "1rem",
}: CodeSyntaxHighlighterProps) => (
  <SyntaxHighlighter
    language={language}
    style={oneDark}
    className="hide-scrollbar"
    customStyle={{
      margin: 0,
      padding,
      fontSize,
      backgroundColor: "transparent",
      height,
      overflow: "auto",
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    }}
    showLineNumbers={true}
    lineNumberStyle={{
      minWidth: "2.5em",
      paddingRight: "1em",
      color: "rgba(156, 163, 175, 0.5)",
      textAlign: "right",
    }}
    codeTagProps={{
      style: {
        display: "inline-block",
        width: "100%",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
      },
    }}
  >
    {code}
  </SyntaxHighlighter>
);

export default CodeViewer;
