import { TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnnotationConfig, Annotations } from "@/types/annotations";

import { AnnotationsInput } from "./AnnotationsInput";
import { COMPUTE_RESOURCES } from "./ComputeResourcesEditor";

interface AnnotationsEditorProps {
  annotations: Annotations;
  onChange: (key: string, value: string | undefined) => void;
  newRows: Array<{ key: string; value: string }>;
  onNewRowChange: (idx: number, field: "key" | "value", value: string) => void;
  onRemoveNewRow: (idx: number) => void;
}

export const COMMON_ANNOTATIONS: AnnotationConfig[] = [
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
  newRows,
  onNewRowChange,
  onRemoveNewRow,
}: AnnotationsEditorProps) => {
  const remainingAnnotations = Object.entries(annotations).filter(
    ([key]) =>
      !COMPUTE_RESOURCES.some((resource) => resource.annotation === key) &&
      !COMMON_ANNOTATIONS.some((common) => common.annotation === key),
  );

  const handleValueChange = (key: string, value: string) => {
    onChange(key, value);
  };

  const handleRemove = (key: string) => {
    onChange(key, undefined);
  };

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
            onChange={(newValue) =>
              handleValueChange(config.annotation, newValue)
            }
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
            onChange={(newValue) => handleValueChange(key, newValue)}
            onDelete={() => handleRemove(key)}
            annotations={annotations}
            deletable
          />
        </div>
      ))}
      {newRows.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2 mt-2">
          <Input
            placeholder="New annotation"
            value={row.key}
            onChange={(e) => onNewRowChange(idx, "key", e.target.value)}
            className="w-39 ml-1"
            autoFocus={idx === newRows.length - 1}
          />
          <Input
            placeholder="value"
            value={row.value}
            onChange={(e) => onNewRowChange(idx, "value", e.target.value)}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveNewRow(idx)}
            title="Remove new annotation"
          >
            <TrashIcon className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
};
