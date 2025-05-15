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

/**
 * Converts a UTC date string to local time
 * @param utcDateString - The UTC date string to convert
 * @returns Date object in local timezone
 */
export const convertUTCToLocalTime = (utcDateString: string): Date => {
  const date = new Date(utcDateString);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
};
