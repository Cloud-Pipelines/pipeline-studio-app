import MonacoEditor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEffect, useRef } from "react";

interface CodeSyntaxHighlighterProps {
  code: string;
  language: string;
  autoScroll?: boolean;
  isFullscreen?: boolean;
}

const CodeSyntaxHighlighter = ({
  code,
  language,
  autoScroll = false,
  isFullscreen = false,
}: CodeSyntaxHighlighterProps) => {
  const editorInstance = useRef<editor.IStandaloneCodeEditor | null>(null);

  const scrollToBottom = () => {
    if (editorInstance.current) {
      const model = editorInstance.current.getModel();
      if (model) {
        const lineCount = model.getLineCount();
        editorInstance.current.revealLine(lineCount);
      }
    }
  };

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [code, autoScroll]);

  useEffect(() => {
    if (!isFullscreen && autoScroll) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isFullscreen, autoScroll]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorInstance.current = editor;

    if (autoScroll) {
      scrollToBottom();
    }
  };

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
