import type { ComponentReferenceWithSpec } from "@/componentStore";

export interface PipelineRowProps {
  url?: string;
  componentRef?: ComponentReferenceWithSpec;
  name?: string;
  modificationTime?: Date;
  onDelete?: () => void;
}
