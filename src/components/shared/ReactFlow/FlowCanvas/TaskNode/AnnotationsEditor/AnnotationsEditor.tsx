import { AlertTriangle, PlusCircleIcon, TrashIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Annotations } from "@/types/annotations";
import type { TaskSpec } from "@/utils/componentSpec";

import {
  COMPUTE_RESOURCES,
  ComputeResourcesEditor,
} from "./ComputeResourcesEditor";

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

  const [invalidRows, setInvalidRows] = useState<string[]>([]);

  const annotationsWithoutComputeResources = Object.entries(annotations).filter(
    ([key]) =>
      !COMPUTE_RESOURCES.some((resource) => resource.annotation === key),
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

    validateJSON(merged);

    setAnnotations(merged);
    setNewRows([]);
    if (onApply) {
      onApply(merged);
    }
  };

  const validateJSON = useCallback(
    (annotations: Annotations) => {
      const invalid: string[] = [];
      for (const [key, value] of Object.entries(annotations)) {
        try {
          JSON.parse(value);
        } catch {
          invalid.push(key);
        }
      }

      setInvalidRows(invalid);
    },
    [annotations, newRows],
  );

  useEffect(() => {
    validateJSON(rawAnnotations);
  }, [rawAnnotations, validateJSON]);

  return (
    <>
      <div className="h-auto flex flex-col gap-2 overflow-y-auto pr-4 py-2 overflow-visible">
        <ComputeResourcesEditor
          annotations={annotations}
          onChange={handleValueChange}
        />
        <hr className="border-t border-dashed border-gray-200 my-4" />
        <div className="h-auto flex flex-col gap-2">
          <h3>Other Annotations</h3>
          {annotationsWithoutComputeResources.map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-40 truncate">
                {key}
              </span>
              <div className="flex-1 relative">
                <Input
                  value={value}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                />

                {invalidRows.includes(key) && (
                  <div className="flex items-center gap-1 my-1 text-xs text-warning">
                    <AlertTriangle className="w-4 h-4" /> Invalid JSON
                  </div>
                )}
              </div>
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
                onChange={(e) =>
                  handleNewRowChange(idx, "value", e.target.value)
                }
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
        </div>
      </div>
      <hr className="border-t border-dashed border-gray-200 my-4" />
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
    </>
  );
};
