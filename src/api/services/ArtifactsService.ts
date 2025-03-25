/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GetArtifactInfoResponse } from '../models/GetArtifactInfoResponse';
import type { GetArtifactSignedUrlResponse } from '../models/GetArtifactSignedUrlResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ArtifactsService {
    /**
     * Get
     * @param id
     * @returns GetArtifactInfoResponse Successful Response
     * @throws ApiError
     */
    public static getApiArtifactsIdGet(
        id: number,
    ): CancelablePromise<GetArtifactInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/artifacts/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Signed Artifact Url
     * @param id
     * @returns GetArtifactSignedUrlResponse Successful Response
     * @throws ApiError
     */
    public static getSignedArtifactUrlApiArtifactsIdSignedArtifactUrlGet(
        id: number,
    ): CancelablePromise<GetArtifactSignedUrlResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/artifacts/{id}/signed_artifact_url',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
