import type { ArgumentType } from "./componentSpec";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatJsonValue = (value: string | object) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value);
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

const getValue = (value: string | ArgumentType | undefined) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value);
  }
};

const removeTrailingDateFromTitle = (baseName: string) => {
  // this regex matches a timestamp in the ISO 8601 format like (YYYY-MM-DDTHH:MM:SS.sssZ) at the very end of a string
  const dateRegex = /\(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\)$/;
  const nameWithoutDate = baseName.replace(dateRegex, "");
  return nameWithoutDate.trimEnd();
};
export {
  copyToClipboard,
  formatBytes,
  formatJsonValue,
  getValue,
  removeTrailingDateFromTitle,
};
