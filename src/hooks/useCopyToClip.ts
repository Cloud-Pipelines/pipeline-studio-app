import { useEffect, useRef, useState } from "react";

import { copyToClipboard } from "@/utils/string";

export function useCopyToClipboard(text?: string | null) {
  const [isCopied, setIsCopied] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  const handleTooltipOpen = (open: boolean) => {
    if (!open) {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      setIsCopied(false);
    }
    setIsTooltipOpen(open);
  };

  const handleCopy = () => {
    if (!text) return;
    copyToClipboard(text);
    setIsCopied(true);
    setIsTooltipOpen(true);

    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => {
      setIsTooltipOpen(false);
    }, 1500);
  };

  return {
    isCopied,
    isTooltipOpen,
    handleCopy,
    handleTooltipOpen,
  };
}
