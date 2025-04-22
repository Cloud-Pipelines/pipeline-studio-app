/**
 * Format date string to localized string
 */
const defaultFormat: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};
export const formatDate = (dateString: string, format = defaultFormat) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", format);
};
