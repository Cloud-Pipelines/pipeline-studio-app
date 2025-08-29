import equal from "fast-deep-equal";
import { useEffect, useRef, useState } from "react";

import { deepClone } from "@/utils/deepClone";

const AUTOSAVE_LOADING_DURATION_MS = 1000; // Minimum duration to show "Saving..." status
export interface AutoSaveStatus {
  isSaving: boolean;
  lastSavedAt: Date | null;
  isDirty: boolean;
}

export const useAutoSave = <T>(
  saveFunction: (data: T) => Promise<void> | void,
  data: T,
  debounceMs: number = 2000,
  shouldSave: boolean = true,
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<T>(deepClone(data));
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const isDirty = !equal(data, lastSavedDataRef.current);

  useEffect(() => {
    let isCancelled = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!shouldSave && isDirty) {
      lastSavedDataRef.current = deepClone(data);
      return;
    }

    if (shouldSave && isDirty) {
      timeoutRef.current = setTimeout(async () => {
        if (isCancelled) return;

        setIsSaving(true);

        const savePromise = (async () => {
          try {
            await saveFunction(data);
            if (!isCancelled) {
              lastSavedDataRef.current = deepClone(data);
              setLastSavedAt(new Date());
            }
          } catch (error) {
            console.error("Auto-save failed:", error);
          }
        })();

        const minDisplayPromise = new Promise((resolve) =>
          setTimeout(resolve, AUTOSAVE_LOADING_DURATION_MS),
        );

        await Promise.all([savePromise, minDisplayPromise]);

        setIsSaving(false);
      }, debounceMs);
    }

    return () => {
      isCancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, isDirty, saveFunction, debounceMs, shouldSave]);

  return {
    isSaving,
    lastSavedAt,
    isDirty,
  };
};
