export interface PipelineRun {
  id: number;
  root_execution_id: number;
  created_at: string;
  created_by: string;
  pipeline_name: string;
  pipeline_digest?: string;
  status?: string;
}
