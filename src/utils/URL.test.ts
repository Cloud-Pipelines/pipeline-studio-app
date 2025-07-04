import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ComponentSpec } from "./componentSpec";
import {
  convertGcsUrlToBrowserUrl,
  convertGithubUrlToDirectoryUrl,
  downloadYamlFromComponentText,
  getIdOrTitleFromPath,
} from "./URL";

// Mock DOM APIs
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(global, "document", {
  value: {
    createElement: mockCreateElement,
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild,
    },
  },
  writable: true,
});

Object.defineProperty(global, "URL", {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

describe("URL utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockCreateElement.mockReturnValue({
      href: "",
      download: "",
      click: mockClick,
    });
    mockCreateObjectURL.mockReturnValue("blob:mock-url");
  });

  describe("convertGcsUrlToBrowserUrl", () => {
    it("converts GCS file URL to browser URL", () => {
      const gcsUrl = "gs://bucket-name/path/to/file.txt";
      const result = convertGcsUrlToBrowserUrl(gcsUrl, false);

      expect(result).toBe(
        "https://storage.cloud.google.com/bucket-name/path/to/file.txt"
      );
    });

    it("converts GCS directory URL to browser URL", () => {
      const gcsUrl = "gs://bucket-name/path/to/directory/";
      const result = convertGcsUrlToBrowserUrl(gcsUrl, true);

      expect(result).toBe(
        "https://console.cloud.google.com/storage/browser/bucket-name/path/to/directory/"
      );
    });

    it("returns original URL for non-GCS URLs", () => {
      const nonGcsUrl = "https://example.com/file.txt";
      const result = convertGcsUrlToBrowserUrl(nonGcsUrl, false);

      expect(result).toBe(nonGcsUrl);
    });
  });

  describe("convertGithubUrlToDirectoryUrl", () => {
    it("converts raw GitHub URL to directory URL", () => {
      const rawUrl =
        "https://raw.githubusercontent.com/user/repo/commit-hash/path/to/file.yaml";
      const result = convertGithubUrlToDirectoryUrl(rawUrl);

      expect(result).toBe(
        "https://github.com/user/repo/tree/commit-hash/path/to"
      );
    });

    it("converts GitHub web URL to directory URL", () => {
      const webUrl =
        "https://github.com/user/repo/blob/commit-hash/path/to/file.yaml";
      const result = convertGithubUrlToDirectoryUrl(webUrl);

      expect(result).toBe(
        "https://github.com/user/repo/tree/commit-hash/path/to"
      );
    });

    it("throws error for unsupported GitHub URL format", () => {
      const unsupportedUrl = "https://github.com/user/repo";

      expect(() => convertGithubUrlToDirectoryUrl(unsupportedUrl)).toThrow(
        "Unsupported GitHub URL format"
      );
    });

    it("throws error for invalid raw GitHub URL", () => {
      const invalidUrl = "https://raw.githubusercontent.com/invalid";

      expect(() => convertGithubUrlToDirectoryUrl(invalidUrl)).toThrow(
        "Invalid GitHub raw URL"
      );
    });

    it("throws error for invalid GitHub web URL", () => {
      const invalidUrl = "https://github.com/invalid";

      expect(() => convertGithubUrlToDirectoryUrl(invalidUrl)).toThrow(
        "Unsupported GitHub URL format"
      );
    });
  });

  describe("downloadYamlFromComponentText", () => {
    it("downloads component as YAML file", () => {
      const componentSpec: ComponentSpec = {
        name: "TestComponent",
        description: "A test component",
        implementation: {
          container: {
            image: "test-image",
          },
        },
      };

      downloadYamlFromComponentText(componentSpec, "Test Display Name");

      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it("uses component name for filename when available", () => {
      const componentSpec: ComponentSpec = {
        name: "MyComponent",
        implementation: {
          container: {
            image: "test-image",
          },
        },
      };

      downloadYamlFromComponentText(componentSpec, "Display Name");

      const createdElement = mockCreateElement.mock.results[0].value;
      expect(createdElement.download).toBe("MyComponent.yaml");
    });

    it("uses display name for filename when component name is not available", () => {
      const componentSpec: ComponentSpec = {
        implementation: {
          container: {
            image: "test-image",
          },
        },
      };

      downloadYamlFromComponentText(componentSpec, "Display Name");

      const createdElement = mockCreateElement.mock.results[0].value;
      expect(createdElement.download).toBe("Display Name.yaml");
    });
  });

  describe("getIdOrTitleFromPath", () => {
    it("extracts ID from run path", () => {
      const pathname = "/runs/12345";
      const result = getIdOrTitleFromPath(pathname);

      expect(result.idOrTitle).toBe("12345");
      expect(result.enableApi).toBe(true);
    });

    it("extracts title from non-run path", () => {
      const pathname = "/editor/my-pipeline";
      const result = getIdOrTitleFromPath(pathname);

      expect(result.idOrTitle).toBe("my-pipeline");
      expect(result.enableApi).toBe(false);
    });

    it("handles URL encoded paths", () => {
      const pathname = "/editor/my%20pipeline%20name";
      const result = getIdOrTitleFromPath(pathname);

      expect(result.idOrTitle).toBe("my pipeline name");
      expect(result.enableApi).toBe(false);
    });

    it("handles empty path", () => {
      const pathname = "/";
      const result = getIdOrTitleFromPath(pathname);

      expect(result.idOrTitle).toBe("");
      expect(result.enableApi).toBe(false);
    });

    it("handles path with trailing slash", () => {
      const pathname = "/runs/12345/";
      const result = getIdOrTitleFromPath(pathname);

      expect(result.idOrTitle).toBe("");
      expect(result.enableApi).toBe(true);
    });
  });
});
