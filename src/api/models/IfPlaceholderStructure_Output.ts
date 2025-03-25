/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConcatPlaceholder_Output } from './ConcatPlaceholder_Output';
import type { IfPlaceholder_Output } from './IfPlaceholder_Output';
import type { InputPathPlaceholder } from './InputPathPlaceholder';
import type { InputValuePlaceholder } from './InputValuePlaceholder';
import type { IsPresentPlaceholder } from './IsPresentPlaceholder';
import type { OutputPathPlaceholder } from './OutputPathPlaceholder';
export type IfPlaceholderStructure_Output = {
    cond: (boolean | string | IsPresentPlaceholder | InputValuePlaceholder);
    then: Array<(string | InputValuePlaceholder | InputPathPlaceholder | OutputPathPlaceholder | ConcatPlaceholder_Output | IfPlaceholder_Output)>;
    else?: null;
};

