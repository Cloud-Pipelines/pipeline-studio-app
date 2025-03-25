/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ComponentReference_Input } from './ComponentReference_Input';
import type { TaskSpec_Input } from './TaskSpec_Input';
export type Body_create_api_pipeline_runs__post = {
    root_task: TaskSpec_Input;
    components?: (Array<ComponentReference_Input> | null);
    annotations?: (Record<string, any> | null);
};

