import type { ComponentReferenceWithSpec } from "@/componentStore";

export interface TaskStatusCounts {
  total: number;
  succeeded: number;
  failed: number;
  running: number;
  waiting: number;
  skipped: number;
}

export interface PipelineRowProps {
  url?: string;
  componentRef?: ComponentReferenceWithSpec;
  name?: string;
  modificationTime?: Date;
}
