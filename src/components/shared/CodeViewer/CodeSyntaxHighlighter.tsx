import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeSyntaxHighlighterProps {
  code: string;
  language: string;
  height?: string;
  fontSize?: string;
  padding?: string;
  wrapLines?: boolean;
  startingLineNumber?: number;
}

const CodeSyntaxHighlighter = ({
  code,
  language,
  height,
  fontSize = "0.875rem",
  padding = "1rem",
  wrapLines = true,
  startingLineNumber = 1,
}: CodeSyntaxHighlighterProps) => (
  <SyntaxHighlighter
    language={language}
    style={oneDark}
    customStyle={{
      margin: 0,
      padding,
      fontSize,
      backgroundColor: "transparent",
      height,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      overflow: "visible",
    }}
    showLineNumbers={true}
    startingLineNumber={startingLineNumber}
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
        overflow: "visible",
        whiteSpace: wrapLines ? "pre-wrap" : "pre",
        wordBreak: wrapLines ? "break-word" : "normal",
      },
    }}
  >
    {code}
  </SyntaxHighlighter>
);

export default CodeSyntaxHighlighter;
