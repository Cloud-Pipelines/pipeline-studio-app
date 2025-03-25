/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GetContainerExecutionLogResponse } from '../models/GetContainerExecutionLogResponse';
import type { GetExecutionArtifactsResponse } from '../models/GetExecutionArtifactsResponse';
import type { GetExecutionInfoResponse } from '../models/GetExecutionInfoResponse';
import type { GetGraphExecutionStateResponse } from '../models/GetGraphExecutionStateResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExecutionsService {
    /**
     * Get
     * @param id
     * @returns GetExecutionInfoResponse Successful Response
     * @throws ApiError
     */
    public static getApiExecutionsIdDetailsGet(
        id: number,
    ): CancelablePromise<GetExecutionInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/executions/{id}/details',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Graph Execution State
     * @param id
     * @returns GetGraphExecutionStateResponse Successful Response
     * @throws ApiError
     */
    public static getGraphExecutionStateApiExecutionsIdStateGet(
        id: number,
    ): CancelablePromise<GetGraphExecutionStateResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/executions/{id}/state',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Artifacts
     * @param id
     * @returns GetExecutionArtifactsResponse Successful Response
     * @throws ApiError
     */
    public static getArtifactsApiExecutionsIdArtifactsGet(
        id: number,
    ): CancelablePromise<GetExecutionArtifactsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/executions/{id}/artifacts',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Container Log
     * @param id
     * @returns GetContainerExecutionLogResponse Successful Response
     * @throws ApiError
     */
    public static getContainerLogApiExecutionsIdContainerLogGet(
        id: number,
    ): CancelablePromise<GetContainerExecutionLogResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/executions/{id}/container_log',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Stream Container Log
     * @param id
     * @returns any Successful Response
     * @throws ApiError
     */
    public static streamContainerLogApiExecutionsIdStreamContainerLogGet(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/executions/{id}/stream_container_log',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
