import MonacoEditor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";

interface CodeSyntaxHighlighterProps {
  code: string;
  language: string;
  isFullscreen?: boolean;
}

const CodeSyntaxHighlighter = ({
  code,
  language,
  isFullscreen = false,
}: CodeSyntaxHighlighterProps) => {
  const editorInstance = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const autoScrollEnabledRef = useRef(true);

  // Keep ref in sync with state
  useEffect(() => {
    autoScrollEnabledRef.current = autoScrollEnabled;
  }, [autoScrollEnabled]);

  const scrollToBottom = useCallback(() => {
    if (editorInstance.current) {
      const model = editorInstance.current.getModel();
      if (model) {
        const lineCount = model.getLineCount();
        editorInstance.current.revealLine(lineCount);
      }
    }
  }, []);

  const isAtBottom = useCallback((): boolean => {
    if (!editorInstance.current) return false;

    const scrollTop = editorInstance.current.getScrollTop();
    const scrollHeight = editorInstance.current.getScrollHeight();
    const layoutInfo = editorInstance.current.getLayoutInfo();
    const visibleHeight = layoutInfo.height;

    // Consider "at bottom" if we're within 50 pixels of the bottom

    const threshold = 50;
    const distanceFromBottom = Math.max(
      0,
      scrollHeight - scrollTop - visibleHeight,
    );

    return distanceFromBottom <= threshold;
  }, []);

  // Auto-scroll when code changes if enabled
  useEffect(() => {
    if (autoScrollEnabled) {
      scrollToBottom();
    }
  }, [code, autoScrollEnabled, scrollToBottom]);

  // Re-scroll when transitioning from fullscreen
  useEffect(() => {
    if (!isFullscreen && autoScrollEnabled) {
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, autoScrollEnabled, scrollToBottom]);

  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      editorInstance.current = editor;

      // Initially scroll to bottom
      scrollToBottom();

      // Listen for scroll events to enable/disable auto-scroll
      editor.onDidScrollChange(() => {
        const atBottom = isAtBottom();

        // Simple logic: if at bottom, enable auto-scroll; if not, disable it
        if (atBottom && !autoScrollEnabledRef.current) {
          setAutoScrollEnabled(true);
        } else if (!atBottom && autoScrollEnabledRef.current) {
          setAutoScrollEnabled(false);
        }
      });
    },
    [isAtBottom, scrollToBottom],
  );

  return (
    <MonacoEditor
      defaultLanguage={language}
      theme="vs-dark"
      value={code}
      onMount={handleEditorDidMount}
      options={{
        readOnly: true,
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        wordWrap: "on",
        automaticLayout: true,
      }}
    />
  );
};

export default CodeSyntaxHighlighter;
