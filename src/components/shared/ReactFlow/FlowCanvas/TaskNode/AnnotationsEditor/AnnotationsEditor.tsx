import type { AnnotationConfig, Annotations } from "@/types/annotations";

import { AnnotationsInput } from "./AnnotationsInput";
import { COMPUTE_RESOURCES } from "./ComputeResourcesEditor";
import { NewAnnotationRow } from "./NewAnnotationRow";

interface AnnotationsEditorProps {
  annotations: Annotations;
  onChange: (key: string, value: string | undefined) => void;
  onBlur: (key: string, value: string | undefined) => void;
  onRemove: (key: string) => void;
  newRows: Array<{ key: string; value: string }>;
  onNewRowBlur: (idx: number, newRow: { key: string; value: string }) => void;
  onRemoveNewRow: (idx: number) => void;
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
  onChange,
  onBlur,
  onRemove,
  newRows,
  onNewRowBlur,
  onRemoveNewRow,
}: AnnotationsEditorProps) => {
  const remainingAnnotations = Object.entries(annotations).filter(
    ([key]) =>
      !COMPUTE_RESOURCES.some((resource) => resource.annotation === key) &&
      !COMMON_ANNOTATIONS.some((common) => common.annotation === key),
  );

  return (
    <div className="h-auto flex flex-col gap-2">
      <h3>Other Annotations</h3>

      {COMMON_ANNOTATIONS.map((config) => (
        <div key={config.annotation} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-40 truncate">
            {config.label} {config.unit && `(${config.unit})`}
          </span>

          <AnnotationsInput
            key={config.annotation}
            value={annotations[config.annotation]}
            onChange={(newValue) => onChange(config.annotation, newValue)}
            onBlur={(newValue) => onBlur(config.annotation, newValue)}
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
            onChange={(newValue) => onChange(key, newValue)}
            onBlur={(newValue) => onBlur(key, newValue)}
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
