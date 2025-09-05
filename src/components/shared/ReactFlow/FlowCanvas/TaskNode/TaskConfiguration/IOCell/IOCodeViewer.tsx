import { CodeViewer } from "@/components/shared/CodeViewer";

const MAX_LINES = 10;
const JSON_CODE_LINE_HEIGHT = 31;
const HEADER_HEIGHT = 55;

interface IOCodeViewerProps {
  title: string;
  value: string;
}

const IOCodeViewer = ({ title, value }: IOCodeViewerProps) => {
  let parsed;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      // Not JSON, treat as plain string
      return (
        <pre className="w-full font-mono text-xs whitespace-pre-line break-words">
          {value || "No value"}
        </pre>
      );
    }
  } else {
    parsed = value;
  }

  const codeString = JSON.stringify(parsed, null, 2);

  const lines = codeString.split("\n");
  const maxLines = Math.min(MAX_LINES, lines.length);
  const lineHeight = `${maxLines * JSON_CODE_LINE_HEIGHT + HEADER_HEIGHT}px`;

  return (
    <div style={{ height: lineHeight }}>
      <CodeViewer code={codeString} language="json" filename={title} />
    </div>
  );
};

export default IOCodeViewer;
