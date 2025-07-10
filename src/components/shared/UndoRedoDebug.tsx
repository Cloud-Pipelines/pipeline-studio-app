import { useComponentSpec } from "@/providers/ComponentSpecProvider";

export const UndoRedoDebug = () => {
  const { canUndo, canRedo } = useComponentSpec();

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-2 text-xs shadow-lg z-50">
      <div>Undo: {canUndo ? "Available" : "Not available"}</div>
      <div>Redo: {canRedo ? "Available" : "Not available"}</div>
    </div>
  );
};
