import { useEffect } from "react";

interface UseCopyPasteProps {
  onCopy: () => void;
  onPaste: () => void;
}

export function useCopyPaste({ onCopy, onPaste }: UseCopyPasteProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const copyKey = isMac ? event.metaKey : event.ctrlKey;

      if (copyKey && event.key === "c") {
        event.preventDefault();
        onCopy();
      }

      if (copyKey && event.key === "v") {
        event.preventDefault();
        onPaste();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCopy, onPaste]);
}
