import type { COMMON_TYPES } from "./constants";

type CommonType = (typeof COMMON_TYPES)[number];

interface TypeMapping {
  inputType: string;
  commonType: CommonType;
}

export type { CommonType, TypeMapping };
