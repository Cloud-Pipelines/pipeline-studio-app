import equal from "fast-deep-equal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { deepClone } from "@/utils/deepClone";

interface UseUndoRedoOptions {
  maxHistorySize?: number;
  debounceMs?: number;
}

export interface UndoRedo {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

export function useUndoRedo<T>(
  currentState: T,
  setState: (state: T) => void,
  options: UseUndoRedoOptions = {},
): UndoRedo {
  const { maxHistorySize = 50, debounceMs = 500 } = options;

  const [history, setHistory] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isUndoRedoOperationRef = useRef(false);
  const previousStateRef = useRef<T | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isUndoRedoOperationRef.current) {
      isUndoRedoOperationRef.current = false;
      return;
    }

    if (
      previousStateRef.current &&
      equal(previousStateRef.current, currentState)
    ) {
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setHistory((prevHistory) => {
        let newHistory = [...prevHistory];
        if (currentIndex < newHistory.length - 1) {
          newHistory = newHistory.slice(0, currentIndex + 1);
        }

        newHistory.push(deepClone(currentState));

        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
          setCurrentIndex(newHistory.length - 2);
        } else {
          setCurrentIndex(newHistory.length - 1);
        }

        return newHistory;
      });

      previousStateRef.current = deepClone(currentState);
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [currentState, maxHistorySize, currentIndex, debounceMs]);

  const undo = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    if (currentIndex > 0) {
      isUndoRedoOperationRef.current = true;
      const newIndex = currentIndex - 1;
      const previousState = history[newIndex];

      setCurrentIndex(newIndex);
      setState(deepClone(previousState));

      previousStateRef.current = deepClone(previousState);
    }
  }, [currentIndex, history, setState]);

  const redo = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    if (currentIndex < history.length - 1) {
      isUndoRedoOperationRef.current = true;
      const newIndex = currentIndex + 1;
      const nextState = history[newIndex];

      setCurrentIndex(newIndex);
      setState(deepClone(nextState));

      previousStateRef.current = deepClone(nextState);
    }
  }, [currentIndex, history, setState]);

  const clearHistory = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    setHistory([]);
    setCurrentIndex(-1);
    previousStateRef.current = null;
  }, []);

  const canUndo = useMemo(() => currentIndex > 0, [currentIndex]);
  const canRedo = useMemo(
    () => currentIndex < history.length - 1,
    [currentIndex, history.length],
  );

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
}
