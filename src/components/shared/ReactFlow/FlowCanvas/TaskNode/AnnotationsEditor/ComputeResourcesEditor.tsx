import { useCallback } from "react";

import type {
  AnnotationConfig,
  AnnotationOption,
  Annotations,
} from "@/types/annotations";

import { AnnotationsInput } from "./AnnotationsInput";

const GPUs: AnnotationOption[] = [
  { value: "NVIDIA-H200", name: "NVIDIA H200" },
  // { value: "nvidia-a100-80gb", name: "NVIDIA A100 80GB" },
  // { value: "nvidia-h100-80gb", name: "NVIDIA H100 80GB" },
  // { value: "nvidia-h100-mega-80gb", name: "NVIDIA H100 80GB MEGA" },
  // { value: "nvidia-l4", name: "NVIDIA L4" },
  // { value: "nvidia-tesla-a100", name: "NVIDIA A100 40GB" },
  // { value: "nvidia-tesla-p4", name: "NVIDIA Tesla P4" },
  // { value: "nvidia-tesla-t4", name: "NVIDIA T4" },
  // { value: "nvidia-tesla-v100", name: "NVIDIA V100" },
];

const CloudProviders: AnnotationOption[] = [
  { value: "google", name: "Google Cloud" },
  { value: "nebius", name: "Nebius Cloud" },
];

export const COMPUTE_RESOURCES: AnnotationConfig[] = [
  {
    annotation: "cloud-pipelines.net/launchers/generic/resources.cpu",
    label: "CPU",
    unit: "cores",
    type: "number",
    min: 0,
  },
  {
    annotation: "cloud-pipelines.net/launchers/generic/resources.memory",
    label: "Memory",
    unit: "GiB",
    type: "number",
    append: "Gi",
    min: 0,
    max: 2880,
  },
  {
    annotation: "cloud-pipelines.net/launchers/generic/resources.accelerators",
    label: "GPU",
    options: GPUs,
    enableQuantity: true,
    min: 0,
  },
  {
    annotation: "cloud-pipelines.net/orchestration/cloud_provider",
    label: "Cloud provider",
    options: CloudProviders,
  },
  // Spot VMs stopped working in Shopify's GCP.
  /*
  {
    annotation: "cloud-pipelines.net/launchers/kubernetes/google/use_spot_vms",
    label: "Use spot VM",
    type: "boolean",
  },
  */
];

interface ComputeResourcesEditorProps {
  annotations: Annotations;
  onChange: (key: string, value: string | undefined) => void;
  onBlur: (key: string, value: string | undefined) => void;
}

export const ComputeResourcesEditor = ({
  annotations,
  onChange,
  onBlur,
}: ComputeResourcesEditorProps) => {
  return (
    <div className="flex flex-col gap-2">
      <h3>Compute Resources</h3>
      {COMPUTE_RESOURCES.map((resource) => (
        <ComputeResourceField
          key={resource.annotation}
          resource={resource}
          annotations={annotations}
          onChange={onChange}
          onBlur={onBlur}
        />
      ))}
    </div>
  );
};

interface ComputeResourceFieldProps {
  resource: AnnotationConfig;
  annotations: Annotations;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string, value: string) => void;
}

const ComputeResourceField = ({
  resource,
  annotations,
  onChange,
  onBlur,
}: ComputeResourceFieldProps) => {
  const handleValueChange = useCallback(
    (value: string) => {
      const formattedValue = resource.append
        ? `${value}${resource.append}`
        : value;
      onChange(resource.annotation, formattedValue);
    },
    [resource, onChange],
  );

  const handleValueBlur = useCallback(
    (value: string) => {
      const formattedValue = resource.append
        ? `${value}${resource.append}`
        : value;
      onBlur(resource.annotation, formattedValue);
    },
    [resource, onBlur],
  );

  const value =
    resource.append && annotations[resource.annotation]
      ? annotations[resource.annotation].replace(
          new RegExp(`${resource.append}$`),
          "",
        )
      : annotations[resource.annotation];

  return (
    <div key={resource.annotation} className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground min-w-24 truncate">
        {resource.label} {resource.unit && `(${resource.unit})`}
      </span>

      <AnnotationsInput
        value={value}
        config={resource}
        onChange={handleValueChange}
        onBlur={handleValueBlur}
        annotations={annotations}
      />
    </div>
  );
};
