/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContainerExecutionStatus } from '../models/ContainerExecutionStatus';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * Admin Set Read Only Model
     * @param readOnly
     * @returns any Successful Response
     * @throws ApiError
     */
    public static adminSetReadOnlyModelApiAdminSetReadOnlyModelPut(
        readOnly: boolean,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/set_read_only_model',
            query: {
                'read_only': readOnly,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Set Execution Node Status
     * @param id
     * @param status
     * @returns any Successful Response
     * @throws ApiError
     */
    public static adminSetExecutionNodeStatusApiAdminExecutionNodeIdStatusPut(
        id: number,
        status: ContainerExecutionStatus,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/execution_node/{id}/status',
            path: {
                'id': id,
            },
            query: {
                'status': status,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
