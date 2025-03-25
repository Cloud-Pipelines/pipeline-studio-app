/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContainerImplementation_Input } from './ContainerImplementation_Input';
import type { GraphImplementation_Input } from './GraphImplementation_Input';
import type { InputSpec } from './InputSpec';
import type { MetadataSpec } from './MetadataSpec';
import type { OutputSpec } from './OutputSpec';
export type ComponentSpec_Input = {
    name?: (string | null);
    description?: (string | null);
    metadata?: (MetadataSpec | null);
    inputs?: (Array<InputSpec> | null);
    outputs?: (Array<OutputSpec> | null);
    implementation?: (ContainerImplementation_Input | GraphImplementation_Input | null);
};

