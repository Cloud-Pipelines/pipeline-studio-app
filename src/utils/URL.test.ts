import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  convertGcsUrlToBrowserUrl,
  convertGithubUrlToDirectoryUrl,
  downloadYamlFromComponentText,
  getIdOrTitleFromPath,
  normalizeUrl,
} from "./URL";

// normalizeUrl tests
describe("normalizeUrl", () => {
  it("returns empty string for empty input", () => {
    expect(normalizeUrl("")).toBe("");
  });

  it("returns empty string for input with only spaces", () => {
    expect(normalizeUrl("   ")).toBe("");
  });

  it("returns unchanged for http:// URLs", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("returns unchanged for https:// URLs", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
  });

  it("prepends http:// for URLs without protocol", () => {
    expect(normalizeUrl("example.com")).toBe("http://example.com");
  });

  it("trims spaces and prepends http:// if missing", () => {
    expect(normalizeUrl("  example.com  ")).toBe("http://example.com");
  });

  it("does not prepend protocol for uppercase HTTP/HTTPS", () => {
    expect(normalizeUrl("HTTP://example.com")).toBe("HTTP://example.com");
    expect(normalizeUrl("HTTPS://example.com")).toBe("HTTPS://example.com");
  });

  it("prepends http:// for other protocols", () => {
    expect(normalizeUrl("ftp://example.com")).toBe("http://ftp://example.com");
  });
});

// convertGcsUrlToBrowserUrl tests
describe("convertGcsUrlToBrowserUrl", () => {
  it("returns unchanged if not a gs:// url", () => {
    expect(convertGcsUrlToBrowserUrl("http://example.com", false)).toBe(
      "http://example.com",
    );
  });

  it("converts gs:// bucket to browser directory url", () => {
    expect(convertGcsUrlToBrowserUrl("gs://my-bucket/my-dir", true)).toBe(
      "https://console.cloud.google.com/storage/browser/my-bucket/my-dir",
    );
  });

  it("converts gs:// file to cloud storage url", () => {
    expect(convertGcsUrlToBrowserUrl("gs://my-bucket/my-file.txt", false)).toBe(
      "https://storage.cloud.google.com/my-bucket/my-file.txt",
    );
  });
});

// convertGithubUrlToDirectoryUrl tests
describe("convertGithubUrlToDirectoryUrl", () => {
  it("converts raw github url to directory url", () => {
    const rawUrl =
      "https://raw.githubusercontent.com/user/repo/commit/path/to/file.txt";
    expect(convertGithubUrlToDirectoryUrl(rawUrl)).toBe(
      "https://github.com/user/repo/tree/commit/path/to",
    );
  });

  it("converts web github url to directory url", () => {
    const webUrl = "https://github.com/user/repo/blob/commit/path/to/file.txt";
    expect(convertGithubUrlToDirectoryUrl(webUrl)).toBe(
      "https://github.com/user/repo/tree/commit/path/to",
    );
  });

  it("throws error for unsupported github url format", () => {
    expect(() =>
      convertGithubUrlToDirectoryUrl("https://github.com/user/repo"),
    ).toThrow();
  });

  it("throws error for invalid raw github url", () => {
    expect(() =>
      convertGithubUrlToDirectoryUrl(
        "https://raw.githubusercontent.com/user/repo",
      ),
    ).toThrow();
  });

  it("throws error for invalid web github url", () => {
    expect(() =>
      convertGithubUrlToDirectoryUrl(
        "https://github.com/user/repo/blob/commit/",
      ),
    ).toThrow();
  });
});

// getIdOrTitleFromPath tests
describe("getIdOrTitleFromPath", () => {
  it("returns last path segment and enableApi true if RUNS_BASE_PATH is present", () => {
    const path = "/foo/bar/runs/123";
    // mock RUNS_BASE_PATH to "/runs"
    vi.mock("@/routes/router", () => ({
      RUNS_BASE_PATH: "/runs",
    }));
    const { idOrTitle, enableApi } = getIdOrTitleFromPath(path);
    expect(idOrTitle).toBe("123");
    expect(enableApi).toBe(true);
  });

  it("returns last path segment and enableApi false if RUNS_BASE_PATH is not present", () => {
    const path = "/foo/bar/other/456";
    const { idOrTitle, enableApi } = getIdOrTitleFromPath(path);
    expect(idOrTitle).toBe("456");
    expect(enableApi).toBe(false);
  });

  it("decodes URI components", () => {
    const path = "/foo/bar/runs/some%20id";
    const { idOrTitle } = getIdOrTitleFromPath(path);
    expect(idOrTitle).toBe("some id");
  });

  it("returns empty string if path ends with slash", () => {
    const path = "/foo/bar/runs/";
    const { idOrTitle } = getIdOrTitleFromPath(path);
    expect(idOrTitle).toBe("");
  });
});

// downloadYamlFromComponentText tests
describe("downloadYamlFromComponentText", () => {
  beforeAll(() => {
    // @ts-expect-error: global.URL may not exist in the test environment, so we mock it for testing purposes
    global.URL = {
      createObjectURL: vi.fn(),
      revokeObjectURL: vi.fn(),
    };
  });

  afterAll(() => {
    // @ts-expect-error: global.URL may not exist in the test environment, so we mock it for testing purposes
    delete global.URL;
  });

  it("creates a downloadable yaml file with correct name", () => {
    const mockComponentSpec = { name: "testComponent", foo: "bar" };
    const displayName = "displayName";
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:url");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);
    const removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node);
    const clickSpy = vi.fn();

    vi.spyOn(document, "createElement").mockImplementation(
      () =>
        ({
          href: "",
          download: "",
          click: clickSpy,
        }) as any,
    );

    downloadYamlFromComponentText(mockComponentSpec as any, displayName);

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:url");
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
