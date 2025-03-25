/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ComponentReference_Output } from './ComponentReference_Output';
import type { ExecutionOptionsSpec } from './ExecutionOptionsSpec';
import type { GraphInputArgument } from './GraphInputArgument';
import type { TaskOutputArgument } from './TaskOutputArgument';
export type TaskSpec_Output = {
    componentRef: ComponentReference_Output;
    arguments?: (Record<string, (string | GraphInputArgument | TaskOutputArgument)> | null);
    isEnabled?: (string | GraphInputArgument | TaskOutputArgument | null);
    executionOptions?: (ExecutionOptionsSpec | null);
    annotations?: (Record<string, any> | null);
};

