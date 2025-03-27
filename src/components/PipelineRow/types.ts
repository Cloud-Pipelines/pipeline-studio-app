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
  componentRef?: import("@/componentStore").ComponentReferenceWithSpec;
  name?: string;
}
