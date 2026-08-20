export const IS_ENABLED_PORT_NAME = "__is_enabled__";
export const IS_ENABLED_INPUT_LABEL = "Run when";

export function isFalseCondition(value: unknown): boolean {
  return String(value).trim().toLowerCase() === "false";
}
