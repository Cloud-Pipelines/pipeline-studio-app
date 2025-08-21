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

/**
 * Format duration between two timestamps
 * @param startTime - Start timestamp string
 * @param endTime - End timestamp string
 * @returns Formatted duration string (e.g., "1h 23m 45s", "2m 30s", "45s")
 */
export const formatDuration = (startTime: string, endTime: string): string => {
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const durationMs = endMs - startMs;

  if (durationMs < 0) return "Invalid duration";

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};
