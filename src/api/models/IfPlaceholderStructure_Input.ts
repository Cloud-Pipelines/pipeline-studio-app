/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConcatPlaceholder_Input } from './ConcatPlaceholder_Input';
import type { IfPlaceholder_Input } from './IfPlaceholder_Input';
import type { InputPathPlaceholder } from './InputPathPlaceholder';
import type { InputValuePlaceholder } from './InputValuePlaceholder';
import type { IsPresentPlaceholder } from './IsPresentPlaceholder';
import type { OutputPathPlaceholder } from './OutputPathPlaceholder';
export type IfPlaceholderStructure_Input = {
    cond: (boolean | string | IsPresentPlaceholder | InputValuePlaceholder);
    then: Array<(string | InputValuePlaceholder | InputPathPlaceholder | OutputPathPlaceholder | ConcatPlaceholder_Input | IfPlaceholder_Input)>;
    else?: null;
};

