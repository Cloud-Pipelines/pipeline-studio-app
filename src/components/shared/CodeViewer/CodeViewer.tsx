import MonacoEditor from "@monaco-editor/react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

interface CodeViewerProps {
  code: string;
  language?: string;
  height?: string;
  title?: string;
  disableFullscreen?: boolean;
}

const CodeViewer = ({
  code,
  language = "yaml",
  height,
  title = "",
  disableFullscreen = false,
}: CodeViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const dynamicHeight = useMemo(() => {
    if (isFullscreen) {
      return "calc(100vh - 100px)"; // Fullscreen height
    }

    if (height) {
      return height;
    }

    const lines = code.split("\n").length;
    const lineHeight = 19;
    const headerHeight = 40;
    const padding = 20;

    return `${Math.max(lines * lineHeight + headerHeight + padding, 50)}px`;
  }, [code, height, isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`${isFullscreen ? "fixed inset-0 z-50 bg-white" : "relative"}`}
    >
      {isFullscreen && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={toggleFullscreen}
        />
      )}
      <div
        className={`${isFullscreen ? "absolute inset-4 bg-white rounded-lg shadow-2xl" : "relative"}`}
      >
        <div className="flex justify-between items-center p-2 border-b bg-gray-50 rounded-t-lg">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          {!disableFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <MonacoEditor
          height={dynamicHeight}
          defaultLanguage={language}
          theme="vs-dark"
          defaultValue={code}
          options={{
            readOnly: true,
            minimap: { enabled: isFullscreen }, // Show minimap in fullscreen
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            wordWrap: "on",
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
};

export default CodeViewer;
