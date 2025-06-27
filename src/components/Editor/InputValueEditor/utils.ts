import type { TypeSpecType } from "@/utils/componentSpec";

import { TYPE_MAPPINGS } from "./constants";
import type { TypeMapping } from "./types";

const getTypeMapping = (inputType?: TypeSpecType): TypeMapping => {
  if (!inputType || typeof inputType !== "string") {
    return TYPE_MAPPINGS.TEXT;
  }

  switch (inputType.toLowerCase()) {
    case "string":
      return TYPE_MAPPINGS.TEXT;
    case "integer":
    case "int":
    case "number":
    case "float":
    case "double":
      return TYPE_MAPPINGS.NUMBER;
    case "boolean":
    case "bool":
      return TYPE_MAPPINGS.BOOLEAN;
    case "datetime":
    case "date":
    case "time":
      return TYPE_MAPPINGS.DATETIME;
    case "array":
    case "list":
    case "object":
    case "dict":
    case "map":
    case "file":
    case "directory":
    case "dir":
    case "json":
    case "yaml":
    case "yml":
    default:
      return TYPE_MAPPINGS.TEXT;
  }
};

export { getTypeMapping };
