import type {
  AnnotationConfig,
  AnnotationOption,
  Annotations,
} from "@/types/annotations";

import { AnnotationsInput } from "./AnnotationsInput";

const GPUs: AnnotationOption[] = [
  { value: "nvidia-a100-80gb", name: "NVIDIA A100 80GB" },
  { value: "nvidia-h100-80gb", name: "NVIDIA H100 80GB" },
  { value: "nvidia-h100-mega-80gb", name: "NVIDIA H100 80GB MEGA" },
  { value: "nvidia-l4", name: "NVIDIA L4" },
  { value: "nvidia-tesla-a100", name: "NVIDIA A100 40GB" },
  { value: "nvidia-tesla-p4", name: "NVIDIA Tesla P4" },
  { value: "nvidia-tesla-t4", name: "NVIDIA T4" },
  { value: "nvidia-tesla-v100", name: "NVIDIA V100" },
];

export const COMPUTE_RESOURCES: AnnotationConfig[] = [
  {
    annotation: "cloud-pipelines.net/launchers/generic/resources.cpu",
    label: "CPU",
    unit: "cores",
    type: "number",
  },
  {
    annotation: "cloud-pipelines.net/launchers/generic/resources.memory",
    label: "Memory",
    unit: "GiB",
    type: "number",
  },
  {
    annotation: "cloud-pipelines.net/launchers/generic/resources.accelerators",
    label: "GPU",
    options: GPUs,
    enableQuantity: true,
  },
  {
    annotation: "cloud-pipelines.net/launchers/kubernetes/google/use_spot_vms",
    label: "Use spot VM",
    type: "boolean",
  },
];

interface ComputeResourcesEditorProps {
  annotations: Annotations;
  onChange: (key: string, value: string | undefined) => void;
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

          <AnnotationsInput
            value={annotations[resource.annotation]}
            config={resource}
            onChange={(newValue) =>
              handleValueChange(resource.annotation, newValue)
            }
            annotations={annotations}
          />
        </div>
      ))}
    </div>
  );
};
