/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GraphInputArgument } from './GraphInputArgument';
import type { TaskOutputArgument } from './TaskOutputArgument';
import type { TaskSpec_Output } from './TaskSpec_Output';
export type GraphSpec_Output = {
    tasks: Record<string, TaskSpec_Output>;
    outputValues?: (Record<string, (string | GraphInputArgument | TaskOutputArgument)> | null);
};

