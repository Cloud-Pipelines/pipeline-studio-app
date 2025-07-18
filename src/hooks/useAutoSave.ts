import equal from "fast-deep-equal";
import { useEffect, useRef } from "react";

import { deepClone } from "@/utils/deepClone";

export const useAutoSave = <T>(
  saveFunction: (data: T) => Promise<void> | void,
  data: T,
  debounceMs: number = 2000,
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<T>(data);
  const hasSavedRef = useRef(false);

  const isDirty = !equal(data, lastSavedDataRef.current);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isDirty) {
      timeoutRef.current = setTimeout(async () => {
        try {
          await saveFunction(data);
          lastSavedDataRef.current = deepClone(data);
          hasSavedRef.current = true;
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, isDirty, saveFunction, debounceMs]);

  useEffect(() => {
    if (!isDirty) {
      lastSavedDataRef.current = deepClone(data);
      hasSavedRef.current = false;
    }
  }, [isDirty, data]);
};
