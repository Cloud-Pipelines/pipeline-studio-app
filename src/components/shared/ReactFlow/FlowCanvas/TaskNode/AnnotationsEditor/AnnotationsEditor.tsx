import { PlusCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import type { AnnotationConfig, Annotations } from "@/types/annotations";

import { AnnotationsInput } from "./AnnotationsInput";
import { COMPUTE_RESOURCES } from "./ComputeResourcesEditor";
import { NewAnnotationRow } from "./NewAnnotationRow";

interface AnnotationsEditorProps {
  annotations: Annotations;
  onSave: (key: string, value: string) => void;
  onRemove: (key: string) => void;
  newRows: Array<{ key: string; value: string }>;
  onNewRowBlur: (idx: number, newRow: { key: string; value: string }) => void;
  onRemoveNewRow: (idx: number) => void;
  onAddNewRow: () => void;
}

const COMMON_ANNOTATIONS: AnnotationConfig[] = [
  {
    annotation: "editor.position",
    label: "Node position",
  },
  {
    annotation: "shopify.io/showback_cost_owner_ref",
    label: "Showback cost owner",
  },
];

export const AnnotationsEditor = ({
  annotations,
  onSave,
  onRemove,
  newRows,
  onNewRowBlur,
  onRemoveNewRow,
  onAddNewRow,
}: AnnotationsEditorProps) => {
  const remainingAnnotations = Object.entries(annotations).filter(
    ([key]) =>
      !COMPUTE_RESOURCES.some((resource) => resource.annotation === key) &&
      !COMMON_ANNOTATIONS.some((common) => common.annotation === key),
  );

  return (
    <div className="h-auto flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Heading level={1}>Annotations</Heading>

        <Button
          onClick={onAddNewRow}
          variant="ghost"
          className="w-fit"
          type="button"
        >
          <PlusCircleIcon className="h-4 w-4" />
          New
        </Button>
      </div>

      {COMMON_ANNOTATIONS.map((config) => (
        <div key={config.annotation} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-40 truncate">
            {config.label} {config.unit && `(${config.unit})`}
          </span>

          <AnnotationsInput
            key={config.annotation}
            value={annotations[config.annotation]}
            onBlur={(newValue) => onSave(config.annotation, newValue)}
            annotations={annotations}
            config={config}
          />
        </div>
      ))}

      {remainingAnnotations.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-40 truncate">
            {key}
          </span>

          <AnnotationsInput
            key={key}
            value={value}
            onBlur={(newValue) => onSave(key, newValue)}
            onDelete={() => onRemove(key)}
            annotations={annotations}
            deletable
          />
        </div>
      ))}

      {newRows.map((row, idx) => (
        <NewAnnotationRow
          key={row.key + idx}
          row={row}
          autofocus={idx === newRows.length - 1}
          onBlur={(newRow) => onNewRowBlur(idx, newRow)}
          onRemove={() => onRemoveNewRow(idx)}
        />
      ))}
    </div>
  );
};
