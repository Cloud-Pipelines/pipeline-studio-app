import type { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Annotations } from "@/types/annotations";

const GPUs = [
  { value: "nvidia-a100-80gb", name: "NVIDIA A100 80GB" },
  { value: "nvidia-h100-80gb", name: "NVIDIA H100 80GB" },
  { value: "nvidia-h100-mega-80gb", name: "NVIDIA H100 80GB MEGA" },
  { value: "nvidia-l4", name: "NVIDIA L4" },
  { value: "nvidia-tesla-a100", name: "NVIDIA A100 40GB" },
  { value: "nvidia-tesla-p4", name: "NVIDIA Tesla P4" },
  { value: "nvidia-tesla-t4", name: "NVIDIA T4" },
  { value: "nvidia-tesla-v100", name: "NVIDIA V100" },
];

export const COMPUTE_RESOURCES = [
  {
    annotation: "cloud-pipelines.net/launchers/generic/resources.cpu",
    label: "CPU",
    unit: "cores",
  },
  {
    annotation: "cloud-pipelines.net/launchers/generic/resources.memory",
    label: "Memory",
    unit: "GiB",
  },
  {
    annotation: "cloud-pipelines.net/launchers/generic/resources.accelerators",
    label: "GPU",
    options: GPUs,
    enableQuantity: true,
  },
];

interface ComputeResourcesEditorProps {
  annotations: Annotations;
  onChange: (key: string, value: string) => void;
}

export const ComputeResourcesEditor = ({
  annotations,
  onChange,
}: ComputeResourcesEditorProps) => {
  const handleValueChange = (key: string, value: string) => {
    onChange(key, value);
  };

  return (
    <div className="flex flex-col gap-2">
      <h3>Compute Resources</h3>
      {COMPUTE_RESOURCES.map((resource) => (
        <div key={resource.annotation} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-40 truncate">
            {resource.label} {resource.unit && `(${resource.unit})`}
          </span>
          {resource.enableQuantity ? (
            <QuantityInputRow
              resource={resource}
              annotations={annotations}
              onChange={handleValueChange}
            />
          ) : resource.options ? (
            <Select
              value={annotations[resource.annotation] || ""}
              onValueChange={(value) =>
                handleValueChange(resource.annotation, value)
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={`Select ${resource.label}`} />
              </SelectTrigger>
              <SelectContent>
                {resource.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={annotations[resource.annotation] || ""}
              onChange={(e) =>
                handleValueChange(resource.annotation, e.target.value)
              }
              className="flex-1"
            />
          )}
        </div>
      ))}
    </div>
  );
};

const QuantityInputRow = ({
  resource,
  annotations,
  onChange,
}: {
  resource: (typeof COMPUTE_RESOURCES)[number];
  annotations: Annotations;
  onChange: (key: string, value: string) => void;
}) => {
  const handleKeyInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    resource: (typeof COMPUTE_RESOURCES)[number],
  ) => {
    const selectedKey = getAnnotationKey(resource.annotation, annotations);
    if (!selectedKey) return;
    const newObj = { [selectedKey]: e.target.value };
    onChange(resource.annotation, JSON.stringify(newObj));
  };

  const handleValueInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    resource: (typeof COMPUTE_RESOURCES)[number],
  ) => {
    const selectedKey = getAnnotationKey(resource.annotation, annotations);
    if (!selectedKey) return;
    const newObj = { [selectedKey]: e.target.value };
    onChange(resource.annotation, JSON.stringify(newObj));
  };

  const handleSelectChange = (
    selectedKey: string,
    resource: (typeof COMPUTE_RESOURCES)[number],
  ) => {
    const quantity = getAnnotationValue(resource.annotation, annotations);
    const newObj = selectedKey ? { [selectedKey]: quantity } : {};
    onChange(resource.annotation, JSON.stringify(newObj));
  };

  return (
    <div className="flex items-center gap-2">
      {resource.options ? (
        <Select
          value={getAnnotationKey(resource.annotation, annotations)}
          onValueChange={(selectedKey) =>
            handleSelectChange(selectedKey, resource)
          }
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={`Select ${resource.label}`} />
          </SelectTrigger>
          <SelectContent>
            {resource.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={getAnnotationKey(resource.annotation, annotations)}
          onChange={(e) => handleKeyInputChange(e, resource)}
        />
      )}
      <span>x</span>
      <Input
        type="number"
        value={getAnnotationValue(resource.annotation, annotations)}
        onChange={(e) => handleValueInputChange(e, resource)}
        className="w-16"
      />
    </div>
  );
};

function getAnnotationKey(annotation: string, annotations: Annotations) {
  try {
    const obj = JSON.parse(annotations[annotation] || "{}");
    return Object.keys(obj)[0] || "";
  } catch {
    return "";
  }
}

function getAnnotationValue(annotation: string, annotations: Annotations) {
  try {
    const obj = JSON.parse(annotations[annotation] || "{}");
    return obj[Object.keys(obj)[0]] || "";
  } catch {
    return "";
  }
}
