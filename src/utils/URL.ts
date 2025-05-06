import yaml from "js-yaml";
const transformGcsUrl = (url: string) => {
  if (url.startsWith("gs://")) {
    return url.replace("gs://", "https://storage.cloud.google.com/");
  }
  return url;
};

import type { ComponentSpec } from "./componentSpec";

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

export {
  convertRawUrlToDirectoryUrl,
  downloadYamlFromComponentText,
  transformGcsUrl,
};
