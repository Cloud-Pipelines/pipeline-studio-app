/**
 * Generates a random alphanumeric ID
 * @param length - The length of the ID to generate
 * @returns A string containing random alphanumeric characters
 */
export const generateId = (length: number = 5): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
