const COMMON_TYPES = ["String", "Number", "Boolean", "DateTime"] as const;
const COMMON_TYPES_MAP = {
  String: "Text",
  Number: "Number",
  Boolean: "Checkbox",
  DateTime: "Date & Time",
} as const;

const TYPE_MAPPINGS = {
  TEXT: { inputType: "text", commonType: "String" as const },
  NUMBER: { inputType: "number", commonType: "Number" as const },
  BOOLEAN: { inputType: "checkbox", commonType: "Boolean" as const },
  DATETIME: { inputType: "datetime-local", commonType: "DateTime" as const },
} as const;

export { COMMON_TYPES, COMMON_TYPES_MAP, TYPE_MAPPINGS };
