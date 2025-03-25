/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContainerImplementation_Output } from './ContainerImplementation_Output';
import type { GraphImplementation_Output } from './GraphImplementation_Output';
import type { InputSpec } from './InputSpec';
import type { MetadataSpec } from './MetadataSpec';
import type { OutputSpec } from './OutputSpec';
export type ComponentSpec_Output = {
    name?: (string | null);
    description?: (string | null);
    metadata?: (MetadataSpec | null);
    inputs?: (Array<InputSpec> | null);
    outputs?: (Array<OutputSpec> | null);
    implementation?: (ContainerImplementation_Output | GraphImplementation_Output | null);
};

