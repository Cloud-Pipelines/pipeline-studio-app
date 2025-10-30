import { useCallback, useEffect, useState } from "react";

import { BlockStack } from "@/components/ui/layout";
import { Separator } from "@/components/ui/separator";
import useToastNotification from "@/hooks/useToastNotification";
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
  const notify = useToastNotification();

  const rawAnnotations = (taskSpec.annotations || {}) as Annotations;

  const [annotations, setAnnotations] = useState<Annotations>({
    ...rawAnnotations,
  });

  // Track new rows separately until they have a key
  const [newRows, setNewRows] = useState<Array<{ key: string; value: string }>>(
    [],
  );

  const handleAddNewRow = useCallback(() => {
    setNewRows((rows) => [...rows, { key: "", value: "" }]);
  }, []);

  const handleRemoveNewRow = useCallback((idx: number) => {
    setNewRows((rows) => rows.filter((_, i) => i !== idx));
  }, []);

  const handleNewRowBlur = useCallback(
    (idx: number, newRow: { key: string; value: string }) => {
      const updatedRows = [...newRows];
      updatedRows[idx] = { ...updatedRows[idx], ...newRow };

      const row = updatedRows[idx];

      if (row.key.trim() && !(row.key in annotations)) {
        const newAnnotations = {
          ...annotations,
          [row.key]: row.value,
        };
        setAnnotations(newAnnotations);
        onApply(newAnnotations);

        setNewRows((rows) => rows.filter((_, i) => i !== idx));
      } else {
        if (row.key.trim() && row.key in annotations) {
          notify("Annotation key already exists", "warning");
        }

        setNewRows(updatedRows);
      }
    },
    [newRows, annotations, onApply],
  );

  const handleRemove = useCallback(
    (key: string) => {
      const { [key]: _, ...rest } = annotations;
      const newAnnotations = rest;
      setAnnotations(newAnnotations);
      onApply(newAnnotations);
    },
    [annotations, onApply],
  );

  const handleSave = useCallback(
    (key: string, value: string | undefined) => {
      if (value === undefined || value === "") {
        // If value is empty or undefined, remove the annotation
        handleRemove(key);
        return;
      }

      const newAnnotations = {
        ...annotations,
        [key]: value,
      };

      setAnnotations(newAnnotations);
      onApply(newAnnotations);
    },
    [annotations, onApply, handleRemove],
  );

  useEffect(() => {
    setAnnotations(rawAnnotations);
  }, [rawAnnotations]);

  return (
    <BlockStack gap="2" className="overflow-y-auto pr-4 py-2 overflow-visible">
      <ComputeResourcesEditor annotations={annotations} onSave={handleSave} />

      <Separator className="mt-4 mb-2" />

      <AnnotationsEditor
        annotations={annotations}
        onSave={handleSave}
        onRemove={handleRemove}
        newRows={newRows}
        onNewRowBlur={handleNewRowBlur}
        onRemoveNewRow={handleRemoveNewRow}
        onAddNewRow={handleAddNewRow}
      />
    </BlockStack>
  );
};
