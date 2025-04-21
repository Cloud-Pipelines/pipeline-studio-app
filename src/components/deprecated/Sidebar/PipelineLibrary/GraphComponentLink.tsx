/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useStore } from "@xyflow/react";
import type { CSSProperties, Ref } from "react";

import { updateComponentSpecFromNodes } from "@/components/shared/ReactFlow/FlowGraph/utils/updateComponentSpecFromNodes";
import type { ComponentSpec } from "@/utils/componentSpec";
import { componentSpecToYaml } from "@/utils/componentStore";

interface GraphComponentLinkProps {
  componentSpec: ComponentSpec;
  downloadFileName?: string;
  linkText?: string;
  linkRef?: Ref<HTMLAnchorElement>;
  style?: CSSProperties;
}

const GraphComponentLink = ({
  componentSpec,
  downloadFileName = "component.yaml",
  linkText = "component.yaml",
  linkRef,
  style,
}: GraphComponentLinkProps) => {
  const nodes = useStore((store) => store.nodes);

  try {
    componentSpec = updateComponentSpecFromNodes(
      componentSpec,
      nodes,
      false,
      true,
    );
  } catch (err: any) {
    if (err?.message?.startsWith("The nodes array does not") !== true) {
      console.error(err);
      return <>err.toString()</>;
    }
  }
  const componentText = componentSpecToYaml(componentSpec);
  const componentTextBlob = new Blob([componentText], { type: "text/yaml" }); // Or application/x-yaml (which leads to downloading)
  return (
    <a
      ref={linkRef}
      href={URL.createObjectURL(componentTextBlob)}
      download={downloadFileName}
      style={style}
    >
      {linkText}
    </a>
  );
};

export default GraphComponentLink;
