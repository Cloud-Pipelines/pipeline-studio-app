import { describe, expect, it } from "vitest";

import { convertUTCToLocalTime, formatDate } from "./date";

describe("date utils", () => {
  describe("formatDate", () => {
    it("formats date with default format", () => {
      const dateString = "2023-12-25T10:30:00Z";
      const result = formatDate(dateString);

      // Should format as "Dec 25, 10:30 AM" (or similar locale format)
      expect(result).toMatch(/Dec 25/);
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Matches any time format
    });

    it("formats date with custom format", () => {
      const dateString = "2023-12-25T10:30:00Z";
      const customFormat: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
      };
      const result = formatDate(dateString, customFormat);

      expect(result).toMatch(/December 2023/);
    });

    it("handles invalid date string", () => {
      const invalidDate = "invalid-date";
      const result = formatDate(invalidDate);

      // Should return "Invalid Date" or similar
      expect(result).toMatch(/Invalid Date|NaN/);
    });
  });

  describe("convertUTCToLocalTime", () => {
    it("converts UTC date to local time", () => {
      const utcDateString = "2023-12-25T10:30:00.000Z";
      const result = convertUTCToLocalTime(utcDateString);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeLessThan(new Date(utcDateString).getTime());
    });

    it("handles invalid UTC date string", () => {
      const invalidDate = "invalid-date";
      const result = convertUTCToLocalTime(invalidDate);

      expect(result).toBeInstanceOf(Date);
      expect(isNaN(result.getTime())).toBe(true);
    });
  });
});
