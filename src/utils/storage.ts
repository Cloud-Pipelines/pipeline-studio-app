/**
 * @license
 * Copyright 2022 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2022 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { type Node } from "@xyflow/react";
import yaml from "js-yaml";

import type { ComponentSpec } from "./componentSpec";
import { componentSpecToYaml } from "./componentStore";
import { SELECTION_TOOLBAR_ID } from "./constants";
import { updateComponentSpecFromNodes } from "./nodes/updateComponentSpecFromNodes";

const SAVED_COMPONENT_SPEC_KEY = "autosaved.component.yaml";

export const replaceLocalStorageWithExperimentYaml = (
  experimentYaml: string,
) => {
  window.sessionStorage.setItem(SAVED_COMPONENT_SPEC_KEY, experimentYaml);
};

export const savePipelineSpecToSessionStorage = (
  componentSpec: ComponentSpec,
  nodes?: Node[],
) => {
  try {
    if (nodes !== undefined) {
      const nodesWithoutToolbar = nodes.filter(
        (node) => node.id !== SELECTION_TOOLBAR_ID,
      );

      componentSpec = updateComponentSpecFromNodes(
        componentSpec,
        nodesWithoutToolbar,
        true,
        true,
      );
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
      SAVED_COMPONENT_SPEC_KEY,
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
