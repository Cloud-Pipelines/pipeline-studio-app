import { describe, expect, it, vi } from "vitest";

import {
  copyToClipboard,
  createStringList,
  formatBytes,
  formatJsonValue,
  getValue,
  removeTrailingDateFromTitle,
} from "./string";

describe("formatBytes", () => {
  it('returns "0 Bytes" for 0 bytes', () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("formats bytes correctly", () => {
    expect(formatBytes(500)).toBe("500 Bytes");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("handles decimal values correctly", () => {
    expect(formatBytes(1500)).toBe("1.46 KB");
    expect(formatBytes(1500000)).toBe("1.43 MB");
  });
});

describe("formatJsonValue", () => {
  it("formats JSON string correctly", () => {
    const jsonString = '{"name": "test", "value": 123}';
    expect(formatJsonValue(jsonString)).toBe(
      '{\n  "name": "test",\n  "value": 123\n}',
    );
  });

  it("formats object correctly", () => {
    const obj = { name: "test", value: 123 };
    expect(formatJsonValue(obj)).toBe(
      '{\n  "name": "test",\n  "value": 123\n}',
    );
  });

  it("returns string as is for invalid JSON", () => {
    const invalidJson = "not a json string";
    expect(formatJsonValue(invalidJson)).toBe("not a json string");
  });
});

describe("copyToClipboard", () => {
  it("calls navigator.clipboard.writeText with correct text", () => {
    const mockWriteText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    copyToClipboard("test text");
    expect(mockWriteText).toHaveBeenCalledWith("test text");
  });
});

describe("getValue", () => {
  it("formats JSON string correctly", () => {
    const jsonString = '{"name": "test", "value": 123}';
    expect(getValue(jsonString)).toBe(
      '{\n  "name": "test",\n  "value": 123\n}',
    );
  });

  it("formats object correctly", () => {
    const obj = { name: "test", value: 123 } as const;
    expect(getValue(JSON.stringify(obj))).toBe(
      '{\n  "name": "test",\n  "value": 123\n}',
    );
  });

  it("returns string as is for invalid JSON", () => {
    const invalidJson = "not a json string";
    expect(getValue(invalidJson)).toBe("not a json string");
  });

  it("handles undefined input", () => {
    expect(getValue(undefined)).toBe(undefined);
  });
});

describe("removeTrailingDateFromTitle", () => {
  it("removes trailing date in correct format", () => {
    const title = "My Pipeline (2024-03-14T15:30:45.123Z)";
    expect(removeTrailingDateFromTitle(title)).toBe("My Pipeline");
  });

  it("removes trailing date with spaces", () => {
    const title = "My Pipeline  (2024-03-14T15:30:45.123Z)";
    expect(removeTrailingDateFromTitle(title)).toBe("My Pipeline");
  });

  it("does not remove date if not at the end", () => {
    const title = "(2024-03-14T15:30:45.123Z) My Pipeline";
    expect(removeTrailingDateFromTitle(title)).toBe(
      "(2024-03-14T15:30:45.123Z) My Pipeline",
    );
  });

  it("does not remove date if format is incorrect", () => {
    const title = "My Pipeline (2024-03-14)";
    expect(removeTrailingDateFromTitle(title)).toBe("My Pipeline (2024-03-14)");
  });

  it("returns original string if no date present", () => {
    const title = "My Pipeline";
    expect(removeTrailingDateFromTitle(title)).toBe("My Pipeline");
  });

  it("handles empty string", () => {
    expect(removeTrailingDateFromTitle("")).toBe("");
  });
});

describe("createStringList", () => {
  const fruits = ["apple", "banana", "cherry", "mango", "strawberry"];
  const label = "fruit";

  it("returns empty string for empty list", () => {
    expect(createStringList([], 3, label)).toBe("");
  });

  it("returns single quoted item for list of one", () => {
    expect(createStringList([fruits[0]], 3, label)).toBe('"apple"');
  });

  it("returns quoted items joined with & for list within elementsToList", () => {
    expect(createStringList(fruits.slice(0, 2), 2, label)).toBe(
      '"apple" & "banana"',
    );
    expect(createStringList(fruits.slice(0, 3), 3, label)).toBe(
      '"apple", "banana" & "cherry"',
    );
  });

  it("returns quoted items (without &) and 'and N other(s)' for list longer than elementsToList", () => {
    expect(createStringList(fruits, 2, label)).toBe(
      '"apple", "banana" and 3 other fruits',
    );
    expect(createStringList(fruits, 3, label)).toBe(
      '"apple", "banana", "cherry" and 2 other fruits',
    );
    expect(createStringList(fruits, 4, label)).toBe(
      '"apple", "banana", "cherry", "mango" and 1 other fruit',
    );
  });

  it("handles pluralization of elementLabel", () => {
    expect(createStringList(fruits, 1, label)).toBe(
      '"apple" and 4 other fruits',
    );
    expect(createStringList(fruits.slice(0, 2), 1, label)).toBe(
      '"apple" and 1 other fruit',
    );
  });

  it("returns correct string when elementsToList is 0", () => {
    expect(createStringList(fruits, 0, label)).toBe("5 fruits");
  });

  it("returns correct string when elementsToList is greater than list length", () => {
    expect(createStringList(fruits.slice(0, 2), 5, label)).toBe(
      '"apple" & "banana"',
    );
    expect(createStringList(fruits, 10, label)).toBe(
      '"apple", "banana", "cherry", "mango" & "strawberry"',
    );
  });
});
