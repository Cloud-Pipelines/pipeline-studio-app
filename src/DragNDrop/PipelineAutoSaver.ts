/**
 * @license
 * Copyright 2022 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2022 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { type Node, useStore } from "@xyflow/react";
import yaml from "js-yaml";

import type { ComponentSpec } from "../componentSpec";
import { componentSpecToYaml } from "../componentStore";
import { augmentComponentSpec } from "./GraphComponentSpecFlow";

const SAVED_COMPONENT_SPEC_KEY = "autosaved.component.yaml";

export const savePipelineSpecToSessionStorage = (
  componentSpec: ComponentSpec,
  nodes?: Node[]
) => {

  try {
    if (nodes !== undefined) {
      if (nodes.length === 0) {
        console.warn("saveComponentSpec: nodes.length === 0");
      }
      componentSpec = augmentComponentSpec(componentSpec, nodes, true, true);
    }
    const componentText = componentSpecToYaml(componentSpec);
    window.sessionStorage.setItem(SAVED_COMPONENT_SPEC_KEY, componentText);
  } catch (err: any) {
    // TODO: Find a way to avoid the React/Redux race conditions causing this error.
    if (err?.message?.startsWith("The nodes array does not") !== true) {
      console.error(err);
    }
  }
};

export const loadPipelineSpecFromSessionStorage = () => {
  try {
    const componentText = window.sessionStorage.getItem(
      SAVED_COMPONENT_SPEC_KEY
    );
    if (componentText !== null) {
      const loadedYaml = yaml.load(componentText);
      if (loadedYaml !== null && typeof loadedYaml === "object") {
        //TODO: Validate that the spec is valid
        const savedComponentSpec = loadedYaml as ComponentSpec;
        return savedComponentSpec;
      }
    }
  } catch (err) {
    console.error(err);
  }
  return undefined;
};

// Auto-saver is extracted to its own child component since useStoreState in the parent causes infinite re-rendering
// (each render of GraphComponentSpecFlow seems to change the Redux store).
// This component seems to be triggered for every node movement, so even pure layout changes are saved.
export const PipelineAutoSaver = ({
  componentSpec,
}: {
  componentSpec: ComponentSpec;
}) => {
  const nodes = useStore((store) => store.nodes);
  // Fixing issue where a React error would cause all node positions to be recorded as undefined (`!<tag:yaml.org,2002:js/undefined>`)
  // nodes should never be undefined in normal situation.
  if (nodes !== undefined && nodes.length > 0) {
    savePipelineSpecToSessionStorage(componentSpec, nodes);
  }
  return null;
};
