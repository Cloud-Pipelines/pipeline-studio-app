/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Ping
     * @returns any Successful Response
     * @throws ApiError
     */
    public static pingServicesPingGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/services/ping',
        });
    }
    /**
     * Get User Names
     * @returns any[] Successful Response
     * @throws ApiError
     */
    public static getUserNamesGetUserNamesGet(): CancelablePromise<any[]> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/get_user_names',
        });
    }
    /**
     * Get Request Headers
     * @returns any[] Successful Response
     * @throws ApiError
     */
    public static getRequestHeadersGetRequestHeadersGet(): CancelablePromise<Array<any[]>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/get_request_headers',
        });
    }
    /**
     * Read Url
     * @param url
     * @returns any Successful Response
     * @throws ApiError
     */
    public static readUrlTestReadUrlGet(
        url: string,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/test/read_url',
            query: {
                'url': url,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Gcs Read
     * @param bucketName
     * @param path
     * @returns string Successful Response
     * @throws ApiError
     */
    public static gcsReadGcsReadGet(
        bucketName?: (string | null),
        path?: (string | null),
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gcs_read',
            query: {
                'bucket_name': bucketName,
                'path': path,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Gke Get Cluster Config
     * @param context
     * @returns string Successful Response
     * @throws ApiError
     */
    public static gkeGetClusterConfigGkeGetClusterConfigGet(
        context?: (string | null),
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gke_get_cluster_config',
            query: {
                'context': context,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Gke List Namespaces
     * @param context
     * @returns any Successful Response
     * @throws ApiError
     */
    public static gkeListNamespacesGkeListNamespacesGet(
        context?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gke_list_namespaces',
            query: {
                'context': context,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Mysql Url
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getMysqlUrlGetMysqlUrlGet(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/get_mysql_url',
        });
    }
    /**
     * Mysql List Tables
     * @param dbUri
     * @returns string Successful Response
     * @throws ApiError
     */
    public static mysqlListTablesMysqlListTablesGet(
        dbUri?: (string | null),
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/mysql_list_tables',
            query: {
                'db_uri': dbUri,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Vertex List Custom Jobs
     * @param project
     * @param location
     * @returns any Successful Response
     * @throws ApiError
     */
    public static vertexListCustomJobsVertexListCustomJobsGet(
        project?: (string | null),
        location?: (string | null),
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/vertex_list_custom_jobs',
            query: {
                'project': project,
                'location': location,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Gke Create Simple Pod
     * @param context
     * @param namespace
     * @returns any Successful Response
     * @throws ApiError
     */
    public static gkeCreateSimplePodTestGkeCreateSimplePodGet(
        context?: (string | null),
        namespace: string = 'kueue-jobs-staging',
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/test/gke_create_simple_pod',
            query: {
                'context': context,
                'namespace': namespace,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Gke Create Gcsfuse Pod
     * @param context
     * @param namespace
     * @param gcsBucketName
     * @param serviceAccountName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static gkeCreateGcsfusePodTestGkeCreateGcsfusePodGet(
        context?: (string | null),
        namespace: string = 'kueue-jobs-staging',
        gcsBucketName?: any,
        serviceAccountName?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/test/gke_create_gcsfuse_pod',
            query: {
                'context': context,
                'namespace': namespace,
                'gcs_bucket_name': gcsBucketName,
                'service_account_name': serviceAccountName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
