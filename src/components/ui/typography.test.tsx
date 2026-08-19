import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Link } from "./link";
import { Heading, Paragraph, Text } from "./typography";

afterEach(cleanup);

const collectTokens = (prefix: string) => {
  const sources = [
    readFileSync("node_modules/tailwindcss/theme.css", "utf8"),
    readFileSync("src/styles/global.css", "utf8"),
  ];
  const pattern = new RegExp(`--${prefix}-([a-z0-9]+):`, "g");
  const tokens = new Set<string>();
  for (const source of sources) {
    for (const [, name] of source.matchAll(pattern)) tokens.add(name);
  }
  return tokens;
};

const configuredFontSizes = () => {
  const globalCss = readFileSync("src/styles/global.css", "utf8");
  if (!globalCss.includes("@config")) return new Set<string>();
  const config = readFileSync("tailwind.config.js", "utf8");
  const block = config.match(/fontSize:\s*\{([^}]*)\}/s)?.[1] ?? "";
  return new Set(
    [...block.matchAll(/["']?([a-z0-9]+)["']?\s*:/g)].map((m) => m[1]),
  );
};

const fontSizeTokens = new Set([
  ...collectTokens("text"),
  ...configuredFontSizes(),
]);
const fontWeightTokens = collectTokens("font-weight");

const classesOf = (element: Element | null) =>
  (element?.className ?? "").split(/\s+/).filter(Boolean);

/** Strips the `!` that `iconVariants`-style utilities prepend. */
const stripImportant = (className: string) => className.replace(/^!/, "");

const resolvesA = (
  classes: string[],
  utilityPrefix: string,
  tokens: Set<string>,
) =>
  classes
    .map(stripImportant)
    .some((className) =>
      className.startsWith(`${utilityPrefix}-`)
        ? tokens.has(className.slice(utilityPrefix.length + 1))
        : false,
    );

describe("Text size scale", () => {
  const sizes = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;

  it.each(sizes)("size=%s emits a font-size Tailwind defines", (size) => {
    const { container } = render(<Text size={size}>body</Text>);

    expect(
      resolvesA(classesOf(container.firstElementChild), "text", fontSizeTokens),
    ).toBe(true);
  });
});

describe("Text weight scale", () => {
  const weights = ["light", "regular", "medium", "semibold", "bold"] as const;

  it.each(weights)(
    "weight=%s emits a font-weight Tailwind defines",
    (weight) => {
      const { container } = render(<Text weight={weight}>body</Text>);

      expect(
        resolvesA(
          classesOf(container.firstElementChild),
          "font",
          fontWeightTokens,
        ),
      ).toBe(true);
    },
  );
});

describe("Paragraph and Heading inherit the working scale", () => {
  it("Paragraph defaults to a defined font-size and weight", () => {
    const { container } = render(<Paragraph>body</Paragraph>);
    const classes = classesOf(container.firstElementChild);

    expect(resolvesA(classes, "text", fontSizeTokens)).toBe(true);
    expect(resolvesA(classes, "font", fontWeightTokens)).toBe(true);
  });

  it.each([1, 2, 3, 4, 5, 6] as const)(
    "Heading level=%s emits a defined font-size",
    (level) => {
      const { container } = render(<Heading level={level}>title</Heading>);

      expect(
        resolvesA(
          classesOf(container.firstElementChild),
          "text",
          fontSizeTokens,
        ),
      ).toBe(true);
    },
  );
});

describe("Link size scale", () => {
  const sizes = ["xs", "sm", "md", "lg"] as const;

  it.each(sizes)("size=%s emits a font-size Tailwind defines", (size) => {
    const { container } = render(<Link size={size}>link</Link>);

    expect(
      resolvesA(classesOf(container.firstElementChild), "text", fontSizeTokens),
    ).toBe(true);
  });
});

const SCANNED_EXTENSIONS = [".ts", ".tsx", ".css"];

// This file is skipped: it has to name the dead classes in order to ban them.
const isScannable = (path: string) =>
  SCANNED_EXTENSIONS.some((extension) => path.endsWith(extension)) &&
  !path.endsWith("typography.test.tsx");

const scannableFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return scannableFiles(path);
    return isScannable(path) ? [path] : [];
  });

describe("dead typography classes", () => {
  const files = scannableFiles("src");

  it.each(["text-md", "font-regular"])("%s appears nowhere in src", (dead) => {
    const hits = files.filter((path) =>
      readFileSync(path, "utf8").includes(dead),
    );

    expect(hits).toEqual([]);
  });
});
