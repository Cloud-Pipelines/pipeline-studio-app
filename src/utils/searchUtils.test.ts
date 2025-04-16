import { describe, expect, it } from "vitest";

import { containsSearchTerm, normalizeForSearch } from "@/utils/searchUtils";

describe("normalizeForSearch", () => {
  it("converts text to lowercase", () => {
    expect(normalizeForSearch("TEXT")).toBe("text");
    expect(normalizeForSearch("Text")).toBe("text");
    expect(normalizeForSearch("tEXT")).toBe("text");
  });

  it("trims whitespace from both ends", () => {
    expect(normalizeForSearch("  text  ")).toBe("text");
    expect(normalizeForSearch(" text")).toBe("text");
    expect(normalizeForSearch("text ")).toBe("text");
  });

  it("handles mixed case and whitespace", () => {
    expect(normalizeForSearch("  TEXT  ")).toBe("text");
    expect(normalizeForSearch(" Text")).toBe("text");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeForSearch("   ")).toBe("");
    expect(normalizeForSearch(" ")).toBe("");
  });
});

describe("containsSearchTerm", () => {
  describe("handling undefined text", () => {
    it("returns false when text is undefined", () => {
      expect(containsSearchTerm(undefined, "search")).toBe(false);
    });
  });

  describe("single word search", () => {
    it("returns true when text contains the search term", () => {
      expect(containsSearchTerm("This is sample text", "sample")).toBe(true);
    });

    it("returns false when text does not contain the search term", () => {
      expect(containsSearchTerm("This is sample text", "missing")).toBe(false);
    });

    it("is case-insensitive", () => {
      expect(containsSearchTerm("This is Sample text", "sample")).toBe(true);
      expect(containsSearchTerm("This is sample text", "SAMPLE")).toBe(true);
    });

    it("handles partial matches", () => {
      expect(containsSearchTerm("This is sample text", "sam")).toBe(true);
      expect(containsSearchTerm("This is sample text", "ple")).toBe(true);
    });

    it("handles search terms with spaces (treated as single word)", () => {
      expect(containsSearchTerm("This is sample text", "is sa")).toBe(true);
    });
  });

  describe("multi-word search", () => {
    it("returns true when text contains all words in any order", () => {
      expect(containsSearchTerm("This is sample text", "text sample")).toBe(
        true,
      );
      expect(containsSearchTerm("This is sample text", "is this")).toBe(true);
    });

    it("returns false when text is missing any of the words", () => {
      expect(containsSearchTerm("This is sample text", "sample missing")).toBe(
        false,
      );
    });

    it("is case-insensitive for all words", () => {
      expect(containsSearchTerm("This is Sample text", "sample TEXT")).toBe(
        true,
      );
    });

    it("handles partial matches for individual words", () => {
      expect(containsSearchTerm("This is sample text", "sam tex")).toBe(true);
    });

    it("ignores empty words in the search term", () => {
      expect(containsSearchTerm("This is sample text", "sample  text")).toBe(
        true,
      );
    });

    it("works with multiple spaces between words", () => {
      expect(containsSearchTerm("This is sample text", "sample    text")).toBe(
        true,
      );
    });
  });

  describe("edge cases", () => {
    it("handles empty search term", () => {
      expect(containsSearchTerm("This is sample text", "")).toBe(true);
    });

    it("handles whitespace-only search term", () => {
      expect(containsSearchTerm("This is sample text", "   ")).toBe(true);
    });

    it("works with special characters", () => {
      expect(
        containsSearchTerm("Text with @special# characters!", "special#"),
      ).toBe(true);
      expect(
        containsSearchTerm("Text with @special# characters!", "@special"),
      ).toBe(true);
    });

    it("works with numbers", () => {
      expect(containsSearchTerm("Text with number 123", "123")).toBe(true);
      expect(containsSearchTerm("Text with number 123", "number 123")).toBe(
        true,
      );
    });
  });
});
