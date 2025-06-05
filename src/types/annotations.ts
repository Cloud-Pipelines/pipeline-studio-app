export type Annotations = Record<string, string>;

export type AnnotationOption = {
  value: string;
  name: string;
};

export type AnnotationConfig = {
  annotation: string;
  label: string;
  unit?: string;
  options?: AnnotationOption[];
  enableQuantity?: boolean;
  type?: "string" | "number" | "boolean";
};
