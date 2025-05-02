/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useStore } from "@xyflow/react";

import type { ComponentSpec } from "@/utils/componentSpec";
import { componentSpecToYaml } from "@/utils/componentStore";
import { SELECTION_TOOLBAR_ID } from "@/utils/constants";
import { updateComponentSpecFromNodes } from "@/utils/nodes/updateComponentSpecFromNodes";

interface GraphComponentExporterProps {
  componentSpec: ComponentSpec;
}

const GraphComponentExporter = ({
  componentSpec,
}: GraphComponentExporterProps) => {
  const nodes = useStore((store) => store.nodes);

  const nodesWithoutToolbar = nodes.filter(
    (node) => node.id !== SELECTION_TOOLBAR_ID,
  );

  let componentText = "";
  try {
    const graphComponent = updateComponentSpecFromNodes(
      componentSpec,
      nodesWithoutToolbar,
      false,
      true,
    );
    componentText = componentSpecToYaml(graphComponent);
  } catch (err) {
    componentText = String(err);
  }

  const componentTextBlob = new Blob([componentText], { type: "text/yaml" }); // Or application/x-yaml (which leads to downloading)
  const downloadLink = (
    <a
      href={URL.createObjectURL(componentTextBlob)}
      download={"component.yaml"}
    >
      component.yaml
    </a>
  );

  return (
    <details>
      <summary>Graph {downloadLink}</summary>
      <pre style={{ overflow: "auto" }}>{componentText}</pre>
    </details>
  );
};

export default GraphComponentExporter;
