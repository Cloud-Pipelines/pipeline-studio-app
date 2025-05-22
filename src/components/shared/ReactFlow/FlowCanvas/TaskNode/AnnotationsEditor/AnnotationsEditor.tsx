import { PlusCircleIcon, TrashIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Annotations } from "@/types/annotations";
import type { TaskSpec } from "@/utils/componentSpec";

interface AnnotationsEditorProps {
  taskSpec: TaskSpec;
  onApply: (annotations: Annotations) => void;
}

const UNREMOVABLE_ANNOTATIONS = ["editor.position"];

export const AnnotationsEditor = ({
  taskSpec,
  onApply,
}: AnnotationsEditorProps) => {
  const rawAnnotations = (taskSpec.annotations || {}) as Annotations;

  const [annotations, setAnnotations] = useState<Annotations>({
    ...rawAnnotations,
  });

  // Track new rows separately until apply
  const [newRows, setNewRows] = useState<Array<{ key: string; value: string }>>(
    [],
  );

  const handleAddNewRow = () => {
    setNewRows((rows) => [...rows, { key: "", value: "" }]);
  };

  const handleNewRowChange = (
    idx: number,
    field: "key" | "value",
    value: string,
  ) => {
    setNewRows((rows) => {
      const updated = [...rows];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleRemoveNewRow = (idx: number) => {
    setNewRows((rows) => rows.filter((_, i) => i !== idx));
  };

  const handleValueChange = (key: string, value: string) => {
    setAnnotations((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRemove = (key: string) => {
    const { [key]: _, ...rest } = annotations;
    setAnnotations(rest);
  };

  const handleApply = () => {
    // Merge valid new rows into annotations
    const validNewRows = newRows.filter(
      (row) => row.key && row.value && !(row.key in annotations),
    );
    const merged = {
      ...annotations,
      ...Object.fromEntries(validNewRows.map((row) => [row.key, row.value])),
    };
    setAnnotations(merged);
    setNewRows([]);
    if (onApply) {
      onApply(merged);
    }
  };

  return (
    <div className="h-auto flex flex-col gap-2 overflow-y-auto pr-4 overflow-visible">
      {Object.entries(annotations).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-40 truncate">
            {key}
          </span>
          <Input
            value={value}
            onChange={(e) => handleValueChange(key, e.target.value)}
            className="flex-1"
          />
          {!UNREMOVABLE_ANNOTATIONS.includes(key) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(key)}
              title="Remove annotation"
            >
              <TrashIcon className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ))}
      {newRows.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2 mt-2">
          <Input
            placeholder="New annotation"
            value={row.key}
            onChange={(e) => handleNewRowChange(idx, "key", e.target.value)}
            className="w-39 ml-1"
            autoFocus={idx === newRows.length - 1}
          />
          <Input
            placeholder="value"
            value={row.value}
            onChange={(e) => handleNewRowChange(idx, "value", e.target.value)}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveNewRow(idx)}
            title="Remove new annotation"
          >
            <TrashIcon className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 justify-end mt-4">
        <Button
          onClick={handleAddNewRow}
          variant="ghost"
          className="w-fit"
          type="button"
        >
          <PlusCircleIcon className="h-4 w-4" />
          New
        </Button>
        <Button className="w-fit" onClick={handleApply}>
          Apply
        </Button>
      </div>
    </div>
  );
};
