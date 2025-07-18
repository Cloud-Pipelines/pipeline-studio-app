import { PlusCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    setAnnotations(rawAnnotations);
  }, [rawAnnotations]);

  return (
    <>
      <div className="h-auto flex flex-col gap-2 overflow-y-auto pr-4 py-2 overflow-visible">
        <ComputeResourcesEditor
          annotations={annotations}
          onChange={handleValueChange}
        />
        <hr className="border-t border-dashed border-gray-200 my-4" />
        <AnnotationsEditor
          annotations={annotations}
          onChange={handleValueChange}
          newRows={newRows}
          onNewRowChange={handleNewRowChange}
          onRemoveNewRow={handleRemoveNewRow}
        />
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
