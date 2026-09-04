import { IncrementingIdGenerator } from "../factories/idGenerator";
import { YamlDeserializer } from "../serialization/yamlDeserializer";
import type { ComponentSpec } from "./componentSpec";
import type { ComponentReference, ComponentSpecJson } from "./types";
import { isGraphImplementation } from "./types";

/**
 * Uses a fresh id generator since the primary entry points (YamlDeserializer,
 * createSubgraph) build their models directly rather than routing through here.
 */
function deserializeSubgraphSpec(specJson: ComponentSpecJson): ComponentSpec {
  const idGen = new IncrementingIdGenerator();
  const deserializer = new YamlDeserializer(idGen);
  const spec = deserializer.deserialize(specJson);
  spec.setEmbeddedSubgraph(true);
  return spec;
}

interface PromotedComponentRef {
  componentRef: ComponentReference;
  subgraphSpec: ComponentSpec | undefined;
}

/**
 * Upholds the invariant that a graph spec never stays as plain JSON on a
 * `Task`: every construction path must route an incoming ref through here,
 * or `subgraphSpec` and `componentRef.spec` disagree about whether the task
 * is a subgraph.
 */
export function promoteInlineSubgraph(
  ref: ComponentReference,
): PromotedComponentRef {
  if (!ref.spec || !isGraphImplementation(ref.spec.implementation)) {
    return { componentRef: ref, subgraphSpec: undefined };
  }

  return {
    componentRef: { ...ref, spec: undefined },
    subgraphSpec: deserializeSubgraphSpec(ref.spec),
  };
}
