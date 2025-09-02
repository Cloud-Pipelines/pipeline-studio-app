import MonacoEditor from "@monaco-editor/react";
import { memo } from "react";

interface CodeSyntaxHighlighterProps {
  code: string;
  language: string;
}

const CodeSyntaxHighlighter = memo(function CodeSyntaxHighlighter({
  code,
  language,
}: CodeSyntaxHighlighterProps) {
  return (
    <MonacoEditor
      defaultLanguage={language}
      theme="vs-dark"
      value={code}
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
});

export default CodeSyntaxHighlighter;
