/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArtifactNodeIdResponse } from './ArtifactNodeIdResponse';
import type { TaskSpec_Output } from './TaskSpec_Output';
export type GetExecutionInfoResponse = {
    id: number;
    task_spec: TaskSpec_Output;
    parent_execution_id?: (number | null);
    child_task_execution_ids: Record<string, number>;
    input_artifacts?: (Record<string, ArtifactNodeIdResponse> | null);
    output_artifacts?: (Record<string, ArtifactNodeIdResponse> | null);
};

