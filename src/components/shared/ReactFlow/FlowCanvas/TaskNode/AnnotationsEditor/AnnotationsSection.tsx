import { useEffect, useState } from "react";

import type { Annotations } from "@/types/annotations";
import type { TaskSpec } from "@/utils/componentSpec";

import { AnnotationsEditor } from "./AnnotationsEditor";
import { ComputeResourcesEditor } from "./ComputeResourcesEditor";

interface AnnotationsSectionProps {
  taskSpec: TaskSpec;
  onApply: (annotations: Annotations) => void;
}

export const AnnotationsSection = ({
  taskSpec,
  onApply,
}: AnnotationsSectionProps) => {
  const rawAnnotations = (taskSpec.annotations || {}) as Annotations;

  const [annotations, setAnnotations] = useState<Annotations>({
    ...rawAnnotations,
  });

  // Track new rows separately until they have a key
  const [newRows, setNewRows] = useState<Array<{ key: string; value: string }>>(
    [],
  );

  const handleAddNewRow = () => {
    setNewRows((rows) => [...rows, { key: "", value: "" }]);
  };

  const handleRemoveNewRow = (idx: number) => {
    setNewRows((rows) => rows.filter((_, i) => i !== idx));
  };

  const handleNewRowBlur = (
    idx: number,
    field: "key" | "value",
    value: string,
  ) => {
    const updatedRows = [...newRows];
    updatedRows[idx] = { ...updatedRows[idx], [field]: value };

    const row = updatedRows[idx];

    if (field === "key" && row.key.trim() && !(row.key in annotations)) {
      const newAnnotations = {
        ...annotations,
        [row.key]: row.value,
      };
      setAnnotations(newAnnotations);
      onApply(newAnnotations);

      setNewRows((rows) => rows.filter((_, i) => i !== idx));
    } else {
      setNewRows(updatedRows);
    }
  };

  const handleValueChange = (key: string, value: string | undefined) => {
    if (value === undefined || value === "") {
      // If value is empty or undefined, remove the annotation
      handleRemove(key);
      return;
    }

    setAnnotations((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleValueBlur = (key: string, value: string | undefined) => {
    const newAnnotations =
      value === undefined || value === ""
        ? (() => {
            const { [key]: _, ...rest } = annotations;
            return rest;
          })()
        : {
            ...annotations,
            [key]: value,
          };

    setAnnotations(newAnnotations);
    onApply(newAnnotations);
  };

  const handleRemove = (key: string) => {
    const { [key]: _, ...rest } = annotations;
    const newAnnotations = rest;
    setAnnotations(newAnnotations);
    onApply(newAnnotations);
  };

  useEffect(() => {
    setAnnotations(rawAnnotations);
  }, [rawAnnotations]);

  return (
    <div className="h-auto flex flex-col gap-2 overflow-y-auto pr-4 py-2 overflow-visible">
      <ComputeResourcesEditor
        annotations={annotations}
        onChange={handleValueChange}
        onBlur={handleValueBlur}
      />

      <hr className="border-t border-dashed border-gray-200 my-4" />

      <AnnotationsEditor
        annotations={annotations}
        onChange={handleValueChange}
        onBlur={handleValueBlur}
        onRemove={handleRemove}
        newRows={newRows}
        onNewRowBlur={handleNewRowBlur}
        onRemoveNewRow={handleRemoveNewRow}
        onAddNewRow={handleAddNewRow}
      />
    </div>
  );
};
