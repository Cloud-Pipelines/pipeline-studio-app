export const PIPELINE_STORAGE_HOST_VERSION = 1;

export interface HostPipelineSummary {
  key: string;
  externalId: string;
  displayName: string | null;
  contentVersion: string;
  createdAt?: string;
  modifiedAt?: string;
}

export interface HostPipeline extends HostPipelineSummary {
  spec: unknown;
}

export type HostErrorCode =
  "unauthenticated" | "not_found" | "rate_limited" | "conflict" | "unavailable";

export interface PipelineStorageHost {
  readonly version: number;
  readonly label: string;
  list(): Promise<HostPipelineSummary[]>;
  read(key: string): Promise<HostPipeline>;
  write(key: string, spec: unknown): Promise<HostPipelineSummary>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

declare global {
  interface Window {
    __TANGLE_PIPELINE_STORAGE_HOST__?: PipelineStorageHost;
  }
}
