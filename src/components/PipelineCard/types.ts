export interface PipelineRun {
  id: number;
  root_execution_id: number;
  created_at: string;
  pipeline_name: string;
  pipeline_digest?: string;
  status?: string;
}

export interface TaskStatusCounts {
  total: number;
  succeeded: number;
  failed: number;
  running: number;
  pending: number;
}

export interface PipelineCardProps {
  url?: string;
  componentRef?: import("@/componentStore").ComponentReferenceWithSpec;
  name?: string;
}
