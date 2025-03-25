/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArtifactDataResponse } from './ArtifactDataResponse';
export type ArtifactNodeResponse = {
    id: number;
    type_name?: (string | null);
    type_properties?: (Record<string, any> | null);
    producer_execution_id?: (number | null);
    producer_output_name?: (string | null);
    artifact_data?: (ArtifactDataResponse | null);
};

