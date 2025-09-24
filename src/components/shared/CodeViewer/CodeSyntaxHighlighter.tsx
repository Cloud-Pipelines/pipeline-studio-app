import MonacoEditor from "@monaco-editor/react";
import { memo } from "react";

interface CodeSyntaxHighlighterProps {
  code: string;
  language: string;
  readOnly?: boolean;
}

const CodeSyntaxHighlighter = memo(function CodeSyntaxHighlighter({
  code,
  language,
  readOnly = true,
}: CodeSyntaxHighlighterProps) {
  return (
    <MonacoEditor
      key={code} // force re-render when code changes
      defaultLanguage={language}
      theme="vs-dark"
      defaultValue={code}
      options={{
        readOnly: readOnly,
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
