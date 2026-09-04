import { computed } from "mobx";
import { idProp, Model, model, modelAction, prop } from "mobx-keystone";

import { Annotations } from "../annotations";
import { serializeComponentSpec } from "../serialization/serialize";
import type { ComponentSpec } from "./componentSpec";
import { createComponentSpecProxy } from "./componentSpecProxy";
import { promoteInlineSubgraph } from "./taskSubgraphHelper";
import type {
  Argument,
  ArgumentType,
  ComponentReference,
  ComponentSpecJson,
  ExecutionOptionsSpec,
} from "./types";
import { isGraphImplementation } from "./types";

@model("spec/Task")
export class Task extends Model({
  $id: idProp,
  name: prop<string>(),
  componentRef: prop<ComponentReference>(),
  subgraphSpec: prop<ComponentSpec | undefined>(undefined),
  isEnabled: prop<ArgumentType | undefined>(undefined),
  annotations: prop<Annotations>(() => new Annotations({})),
  arguments: prop<Argument[]>(() => []),
  executionOptions: prop<ExecutionOptionsSpec | undefined>(undefined),
}) {
  @modelAction
  setName(name: string) {
    this.name = name;
  }

  @modelAction
  setSubgraphSpec(spec: ComponentSpec | undefined) {
    if (spec) {
      spec.setEmbeddedSubgraph(true);
    }
    this.subgraphSpec = spec;
  }

  @modelAction
  setComponentRef(ref: ComponentReference) {
    const { componentRef, subgraphSpec } = promoteInlineSubgraph(ref);
    this.subgraphSpec = subgraphSpec;
    this.componentRef = componentRef;
  }

  @computed
  get resolvedComponentSpec(): ComponentSpecJson | undefined {
    if (this.subgraphSpec) {
      return createComponentSpecProxy(this.subgraphSpec);
    }
    return this.componentRef.spec;
  }

  @computed
  get isSubgraph(): boolean {
    return isGraphImplementation(this.resolvedComponentSpec?.implementation);
  }

  @computed
  get resolvedComponentRef(): ComponentReference {
    if (!this.subgraphSpec) {
      return this.componentRef;
    }

    return {
      ...this.componentRef,
      spec: serializeComponentSpec(this.subgraphSpec),
    };
  }

  @modelAction
  setIsEnabled(predicate: ArgumentType | undefined) {
    this.isEnabled = predicate;
  }

  @modelAction
  addArgument(arg: Argument) {
    this.arguments.push(arg);
  }

  @modelAction
  setArgument(name: string, value: ArgumentType | undefined) {
    const idx = this.arguments.findIndex((a) => a.name === name);
    if (idx >= 0) {
      this.arguments[idx] = { name, value };
    } else {
      this.arguments.push({ name, value });
    }
  }

  @modelAction
  removeArgument(index: number) {
    this.arguments.splice(index, 1);
  }

  @modelAction
  removeArgumentByName(name: string) {
    const idx = this.arguments.findIndex((a) => a.name === name);
    if (idx >= 0) this.arguments.splice(idx, 1);
  }

  @modelAction
  clearArguments() {
    this.arguments.splice(0, this.arguments.length);
  }

  @modelAction
  setCacheStaleness(value: string | undefined) {
    if (value) {
      this.executionOptions = {
        ...this.executionOptions,
        cachingStrategy: { maxCacheStaleness: value },
      };
    } else {
      if (this.executionOptions) {
        const { cachingStrategy: _, ...rest } = this.executionOptions;
        this.executionOptions = Object.keys(rest).length > 0 ? rest : undefined;
      }
    }
  }
}
