/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GraphInputArgument } from './GraphInputArgument';
import type { TaskOutputArgument } from './TaskOutputArgument';
import type { TaskSpec_Input } from './TaskSpec_Input';
export type GraphSpec_Input = {
    tasks: Record<string, TaskSpec_Input>;
    outputValues?: (Record<string, (string | GraphInputArgument | TaskOutputArgument)> | null);
};

