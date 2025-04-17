export interface TaskStatusCounts {
  total: number;
  succeeded: number;
  failed: number;
  running: number;
  waiting: number;
  skipped: number;
}

export interface PipelineRowProps {
  name?: string;
  modificationTime?: Date;
  onDelete?: () => void;
}
