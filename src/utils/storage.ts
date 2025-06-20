/**
 * @license
 * Copyright 2022 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2022 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { type Node } from "@xyflow/react";

import type { ComponentSpec } from "./componentSpec";
import { componentSpecToYaml } from "./componentStore";
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
      componentSpec = updateComponentSpecFromNodes(
        componentSpec,
        nodes,
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
