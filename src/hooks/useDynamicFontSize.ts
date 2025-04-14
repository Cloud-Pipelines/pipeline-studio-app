import { type RefObject, useEffect } from "react";

/**
 * Custom hook to dynamically adjust the font size of a text element
 * to fit the width of its container.
 * If the required font size is too small, the text will wrap to
 * multiple lines.
 *
 * @param textRef - Ref to the text element to adjust.
 */

const MIN_FONTSIZE = 12; // Tailwind text-xs fontsize

export const useDynamicFontSize = (
  textRef: RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    if (textRef.current) {
      const containerWidth = textRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;

      if (textWidth >= containerWidth) {
        const scaleFactor = containerWidth / textWidth;

        const originalFontSize = parseFloat(
          window.getComputedStyle(textRef.current).fontSize,
        );

        const newFontSize = Math.max(
          originalFontSize * scaleFactor,
          MIN_FONTSIZE,
        );

        textRef.current.style.fontSize = `${newFontSize}px`;

        if (newFontSize === MIN_FONTSIZE) {
          textRef.current.style.whiteSpace = "normal";
          textRef.current.style.textWrap = "balanced";
          textRef.current.style.wordBreak = "break-word";
        } else {
          textRef.current.style.whiteSpace = "nowrap";
        }
      } else {
        textRef.current.style.transform = "none";
      }
    }
  }, [textRef]);
};
