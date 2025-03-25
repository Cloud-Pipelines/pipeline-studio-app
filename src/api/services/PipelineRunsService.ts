/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_create_api_pipeline_runs__post } from '../models/Body_create_api_pipeline_runs__post';
import type { ListPipelineJobsResponse } from '../models/ListPipelineJobsResponse';
import type { PipelineRunResponse } from '../models/PipelineRunResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PipelineRunsService {
    /**
     * List
     * @param pageToken
     * @returns ListPipelineJobsResponse Successful Response
     * @throws ApiError
     */
    public static listApiPipelineRunsGet(
        pageToken?: (string | null),
    ): CancelablePromise<ListPipelineJobsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/pipeline_runs/',
            query: {
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create
     * @param requestBody
     * @returns PipelineRunResponse Successful Response
     * @throws ApiError
     */
    public static createApiPipelineRunsPost(
        requestBody: Body_create_api_pipeline_runs__post,
    ): CancelablePromise<PipelineRunResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/pipeline_runs/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get
     * @param id
     * @returns PipelineRunResponse Successful Response
     * @throws ApiError
     */
    public static getApiPipelineRunsIdGet(
        id: number,
    ): CancelablePromise<PipelineRunResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/pipeline_runs/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
