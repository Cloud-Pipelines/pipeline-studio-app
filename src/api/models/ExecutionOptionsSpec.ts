/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CachingStrategySpec } from './CachingStrategySpec';
import type { RetryStrategySpec } from './RetryStrategySpec';
export type ExecutionOptionsSpec = {
    retryStrategy?: (RetryStrategySpec | null);
    cachingStrategy?: (CachingStrategySpec | null);
};

