import { DiffEditor, Editor } from "@monaco-editor/react";

/**
 * Read-only Monaco surfaces for the comparison view, pinned to the dark theme
 * regardless of the app theme so diffed code always renders on the same ground.
 */
const READ_ONLY_OPTIONS = {
  readOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: "on",
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
} as const;

const DIFF_OPTIONS = {
  ...READ_ONLY_OPTIONS,
  renderSideBySide: true,
  renderOverviewRuler: false,
} as const;

interface DiffCodeViewerProps {
  original: string;
  modified: string;
  language: string;
}

export function DiffCodeViewer({
  original,
  modified,
  language,
}: DiffCodeViewerProps) {
  return (
    <DiffEditor
      original={original}
      modified={modified}
      language={language}
      theme="vs-dark"
      options={DIFF_OPTIONS}
    />
  );
}

interface CodeViewerProps {
  value: string;
  language: string;
}

export function CodeViewer({ value, language }: CodeViewerProps) {
  return (
    <Editor
      value={value}
      language={language}
      theme="vs-dark"
      options={READ_ONLY_OPTIONS}
    />
  );
}
