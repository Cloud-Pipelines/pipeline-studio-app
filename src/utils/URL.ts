import yaml from "js-yaml";

import { RUNS_BASE_PATH } from "@/routes/router";

import type { ComponentSpec } from "./componentSpec";

const convertGcsUrlToBrowserUrl = (
  url: string,
  isDirectory: boolean,
): string => {
  if (!url.startsWith("gs://")) {
    return url;
  }

  if (isDirectory) {
    return url.replace(
      "gs://",
      "https://console.cloud.google.com/storage/browser/",
    );
  }
  return url.replace("gs://", "https://storage.cloud.google.com/");
};

const convertRawUrlToDirectoryUrl = (rawUrl: string) => {
  const urlPattern =
    /^https:\/\/raw.githubusercontent.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/;
  const match = rawUrl.match(urlPattern);

  if (match) {
    const user = match[1];
    const repo = match[2];
    const commitHash = match[3];
    const filePath = match[4];
    const directoryPath = filePath.substring(0, filePath.lastIndexOf("/"));

    const directoryUrl = `https://github.com/${user}/${repo}/tree/${commitHash}/${directoryPath}`;
    return directoryUrl;
  } else {
    throw new Error("Invalid GitHub raw URL");
  }
};

const convertWebUrlToDirectoryUrl = (webUrl: string) => {
  const urlPattern =
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;
  const match = webUrl.match(urlPattern);

  if (match) {
    const user = match[1];
    const repo = match[2];
    const commitHash = match[3];
    const filePath = match[4];
    const directoryPath = filePath.substring(0, filePath.lastIndexOf("/"));

    return `https://github.com/${user}/${repo}/tree/${commitHash}/${directoryPath}`;
  } else {
    throw new Error("Invalid GitHub web URL");
  }
};

const isGithubUrl = (url: string) => {
  return (
    url.startsWith("https://raw.githubusercontent.com/") ||
    url.startsWith("https://github.com/")
  );
};

const convertGithubUrlToDirectoryUrl = (url: string) => {
  if (url.startsWith("https://raw.githubusercontent.com/")) {
    return convertRawUrlToDirectoryUrl(url);
  } else if (url.startsWith("https://github.com/") && url.includes("/blob/")) {
    return convertWebUrlToDirectoryUrl(url);
  } else {
    throw new Error("Unsupported GitHub URL format");
  }
};

const downloadYamlFromComponentText = (
  componentSpec: ComponentSpec,
  displayName: string,
) => {
  const componentText = yaml.dump(componentSpec, {
    lineWidth: 80,
    noRefs: true,
    indent: 2,
  });
  const blob = new Blob([componentText], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${componentSpec?.name || displayName}.yaml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const getIdOrTitleFromPath = (
  pathname: string,
): {
  id?: string;
  title?: string;
} => {
  const isRunPath = pathname.includes(RUNS_BASE_PATH);

  const lastPathSegment = pathname.split("/").pop() || "";
  const isId = lastPathSegment.match(/^[0-9a-fA-F]{20}$/) || isRunPath;
  const decodedSegment = decodeURIComponent(lastPathSegment);

  if (decodedSegment === "") {
    return { id: undefined, title: undefined };
  }

  return {
    id: isId ? decodedSegment : undefined,
    title: isId ? undefined : decodedSegment,
  };
};

const normalizeUrl = (url: string) => {
  if (url.trim() === "") {
    return "";
  }

  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = "http://" + normalizedUrl;
  }
  return normalizedUrl;
};

export {
  convertGcsUrlToBrowserUrl,
  convertGithubUrlToDirectoryUrl,
  downloadYamlFromComponentText,
  getIdOrTitleFromPath,
  isGithubUrl,
  normalizeUrl,
};
