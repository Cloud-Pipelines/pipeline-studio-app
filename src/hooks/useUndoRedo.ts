import { useCallback, useRef } from "react";

import type { ComponentSpec } from "@/utils/componentSpec";

interface UndoRedoState {
  undoStack: ComponentSpec[];
  redoStack: ComponentSpec[];
  maxStackSize: number;
}

export const useUndoRedo = (maxStackSize: number = 50) => {
  const stateRef = useRef<UndoRedoState>({
    undoStack: [],
    redoStack: [],
    maxStackSize,
  });

  const saveVersion = useCallback((componentSpec: ComponentSpec) => {
    const state = stateRef.current;

    // Deep clone the component spec to avoid reference issues
    const clonedSpec = JSON.parse(JSON.stringify(componentSpec));

    // Add to undo stack
    state.undoStack.push(clonedSpec);

    // Limit stack size
    if (state.undoStack.length > state.maxStackSize) {
      state.undoStack.shift();
    }

    // Clear redo stack when a new action is performed
    state.redoStack = [];
  }, []);

  const canUndo = useCallback(() => {
    return stateRef.current.undoStack.length > 0;
  }, []);

  const canRedo = useCallback(() => {
    return stateRef.current.redoStack.length > 0;
  }, []);

  const undo = useCallback((): ComponentSpec | null => {
    const state = stateRef.current;

    if (state.undoStack.length === 0) {
      return null;
    }

    // Pop from undo stack
    const previousVersion = state.undoStack.pop()!;

    // Add current version to redo stack
    if (state.redoStack.length >= state.maxStackSize) {
      state.redoStack.shift();
    }

    return previousVersion;
  }, []);

  const redo = useCallback((): ComponentSpec | null => {
    const state = stateRef.current;

    if (state.redoStack.length === 0) {
      return null;
    }

    // Pop from redo stack
    const nextVersion = state.redoStack.pop()!;

    // Add current version back to undo stack
    if (state.undoStack.length >= state.maxStackSize) {
      state.undoStack.shift();
    }

    return nextVersion;
  }, []);

  const clearHistory = useCallback(() => {
    stateRef.current.undoStack = [];
    stateRef.current.redoStack = [];
  }, []);

  const getStackInfo = useCallback(() => {
    const state = stateRef.current;
    return {
      undoCount: state.undoStack.length,
      redoCount: state.redoStack.length,
      maxStackSize: state.maxStackSize,
    };
  }, []);

  return {
    saveVersion,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getStackInfo,
  };
};
