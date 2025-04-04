/* This will eventually need to move into a Context Provider so that we can manage id uniqueness globally across the app */
export const generateDuplicateStringId = (stringId: string) => {
  // If stringId does not end with "_copy", append "_copy"
  // e.g., "task" becomes "task_copy"
  if (!stringId.endsWith("_copy")) {
    return stringId + "_copy";
  }

  // If stringId ends with "_copy", add a number to the end
  // e.g., "task_copy" becomes "task_copy2"
  if (stringId.endsWith("_copy")) {
    return stringId + "2";
  }

  // If stringId ends with "_copyX", increment X
  // e.g., "task_copy2" becomes "task_copy3"
  const match = stringId.match(/^(.*_copy)(\d+)$/);
  if (match) {
    const base = match[1];
    const number = parseInt(match[2], 10);
    return `${base}${number + 1}`;
  }

  // Otherwise, append "_c" - this case should not occur
  return stringId + "_c";
};
