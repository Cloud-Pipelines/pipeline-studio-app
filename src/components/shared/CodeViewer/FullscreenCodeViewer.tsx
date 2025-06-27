import { X } from "lucide-react";
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

import { Button } from "@/components/ui/button";

import CodeSyntaxHighlighter from "./CodeSyntaxHighlighter";

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

interface FullscreenViewProps {
  content: CodeContent;
  onClose: () => void;
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
