import { isFlagEnabled } from "@/components/shared/Settings/useFlags";
import schema from "@/config/launcherTaskAnnotationSchema.json";
import type { AnnotationConfig, AnnotationOption } from "@/types/annotations";

interface JSONSchemaProperty {
  type: string;
  title?: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  inclusiveMinimum?: number;
  inclusiveMaximum?: number;
  pattern?: string;
  enum?: string[];
  required?: boolean;
  "x-unit"?: string;
  "x-append"?: string;
  "x-enable-quantity"?: boolean;
  "x-enum-labels"?: Record<string, string>;
  "x-enum-deprecated"?: Record<string, boolean>;
  "x-enum-deprecated-messages"?: Record<string, string>;
  "x-enum-successors"?: Record<string, LauncherAcceleratorSuccessor>;
  "x-allow-custom-value"?: boolean;
  "x-hidden"?: boolean;
  "x-type"?: string;
}

interface JSONSchemaObject {
  type: string;
  title?: string;
  properties: Record<string, JSONSchemaProperty>;
  "feature-flag-key"?: string;
  "x-active"?: boolean;
  "x-deprecated"?: boolean;
  "x-deprecated-message"?: string;
  "x-successor"?: LauncherClusterSuccessor;
  "x-provider"?: string;
  "x-project"?: string;
  "x-cluster"?: string;
  "x-aliases"?: string[];
}

interface CloudProviderSchema extends JSONSchemaProperty {
  annotation: string;
}

export interface LauncherAnnotationSchema {
  $schema?: string;
  type?: string;
  title?: string;
  cloud_provider?: CloudProviderSchema;
  launcher_annotation_schemas?: Record<string, JSONSchemaObject>;
  common_annotations?: JSONSchemaObject;
}

export interface LauncherClusterSuccessor {
  cluster: string;
  cluster_label: string | null;
}

export interface LauncherAcceleratorSuccessor extends LauncherClusterSuccessor {
  product: string;
  product_label: string | null;
}

export interface LauncherAcceleratorCapability {
  product: string;
  label: string | null;
  valid_until: string | null;
  succeeded_by?: LauncherAcceleratorSuccessor | null;
}

export interface LauncherFieldCapability {
  annotation: string;
  label?: string;
  type?: string;
  description?: string;
  min?: number;
  max?: number;
  unit?: string;
  append?: string;
  enable_quantity?: boolean;
  allow_custom_value?: boolean;
  required?: boolean;
  enum?: string[];
  enum_labels?: Record<string, string>;
}

export interface LauncherClusterCapability {
  key: string;
  provider_label: string;
  label: string | null;
  project: string | null;
  default: boolean | null;
  valid_until?: string | null;
  succeeded_by?: LauncherClusterSuccessor | null;
  accelerators: LauncherAcceleratorCapability[];
  fields: LauncherFieldCapability[];
}

export interface LauncherCapabilities {
  cloud_provider?: { annotation: string; label: string };
  aliases?: Record<string, string>;
  clusters: LauncherClusterCapability[];
}

export const launcherTaskAnnotationSchema =
  schema satisfies LauncherAnnotationSchema;

export function parseSchemaToAnnotationConfig(
  schema: JSONSchemaObject,
): AnnotationConfig[] {
  const configs: AnnotationConfig[] = [];

  for (const [annotation, property] of Object.entries(schema.properties)) {
    const config: AnnotationConfig = {
      annotation,
      label: property.title || annotation,
    };

    if (property.required) {
      config.required = true;
    }

    // Handle unit
    if (property["x-unit"]) {
      config.unit = property["x-unit"];
    }

    // Handle append suffix
    if (property["x-append"]) {
      config.append = property["x-append"];
    }

    // Handle min/max for numbers
    if (property.exclusiveMinimum !== undefined) {
      config.min = property.exclusiveMinimum + 1;
    }
    if (property.exclusiveMaximum !== undefined) {
      config.max = property.exclusiveMaximum - 1;
    }
    if (property.inclusiveMinimum !== undefined) {
      config.min = property.inclusiveMinimum;
    }
    if (property.inclusiveMaximum !== undefined) {
      config.max = property.inclusiveMaximum;
    }
    if (property.minimum !== undefined) {
      config.min = property.minimum;
    }
    if (property.maximum !== undefined) {
      config.max = property.maximum;
    }

    // Handle type
    // Check for custom x-type first
    const customType = property["x-type"];
    if (customType === "json") {
      config.type = "json";
    } else if (property.type === "number") {
      config.type = "number";
    } else if (property.type === "integer") {
      config.type = "integer";
    } else if (property.type === "boolean") {
      config.type = "boolean";
    } else if (property.type === "string") {
      config.type = "string";
    }

    // Handle enum as options
    if (property.enum) {
      config.options = enumToOptions(property);
    }

    // Handle custom value allowance
    if (property["x-allow-custom-value"]) {
      config.allowCustomValue = true;
    }

    if (property.description) {
      config.description = property.description;
    }

    // Handle quantity enablement
    if (property["x-enable-quantity"]) {
      config.enableQuantity = true;
    }

    if (property["x-hidden"]) {
      config.hidden = true;
    }

    configs.push(config);
  }

  return configs;
}

function parseCloudProviderConfig(
  providerSchema: CloudProviderSchema,
): AnnotationConfig {
  const config: AnnotationConfig = {
    annotation: providerSchema.annotation,
    label: providerSchema.title || "Cloud Provider",
    type: "string",
  };

  if (providerSchema.enum) {
    config.options = enumToOptions(providerSchema);
  }

  return config;
}

export function getCloudProviderConfig(
  schema: LauncherAnnotationSchema,
): AnnotationConfig | null {
  if (!schema.cloud_provider || !schema.launcher_annotation_schemas) {
    return null;
  }

  const config = parseCloudProviderConfig(schema.cloud_provider);

  // If no manual enum is specified, generate from launcher schemas
  if (!config.options) {
    const options: AnnotationOption[] = Object.entries(
      schema.launcher_annotation_schemas,
    )
      .filter(([, launcherSchema]) => {
        if (launcherSchema["x-active"] === false) {
          return false;
        }
        const flagKey = launcherSchema["feature-flag-key"];
        return !flagKey || isFlagEnabled(flagKey);
      })
      .map(([key, launcherSchema]) => {
        const option: AnnotationOption = {
          value: key,
          name: launcherSchema.title || key,
        };
        if (launcherSchema["x-provider"]) {
          option.provider = launcherSchema["x-provider"];
        }
        if (launcherSchema["x-project"]) {
          option.project = launcherSchema["x-project"];
        }
        if (launcherSchema["x-cluster"]) {
          option.cluster = launcherSchema["x-cluster"];
        }
        if (launcherSchema["x-deprecated"]) {
          option.deprecated = true;
          const message = launcherSchema["x-deprecated-message"];
          if (message) {
            option.deprecationMessage = message;
          }
        }
        return option;
      });
    config.options = options;
  }

  return config;
}

export function resolveLauncherKey(
  schema: LauncherAnnotationSchema,
  value: string | undefined,
): string | undefined {
  if (!value || !schema.launcher_annotation_schemas) {
    return value;
  }

  if (schema.launcher_annotation_schemas[value]) {
    return value;
  }

  for (const [key, launcherSchema] of Object.entries(
    schema.launcher_annotation_schemas,
  )) {
    if (launcherSchema["x-aliases"]?.includes(value)) {
      return key;
    }
  }

  return value;
}

export function getProviderSchema(
  schema: LauncherAnnotationSchema,
  provider: string | undefined,
): JSONSchemaObject | null {
  if (!provider || !schema.launcher_annotation_schemas) {
    return null;
  }

  const resolvedKey = resolveLauncherKey(schema, provider);
  return schema.launcher_annotation_schemas[resolvedKey ?? provider] || null;
}

export function getCommonAnnotations(
  schema: LauncherAnnotationSchema,
): AnnotationConfig[] {
  if (!schema.common_annotations) {
    return [];
  }

  return parseSchemaToAnnotationConfig(schema.common_annotations);
}

function enumToOptions(property: JSONSchemaProperty): AnnotationOption[] {
  const labels = property["x-enum-labels"];
  const deprecated = property["x-enum-deprecated"];
  const messages = property["x-enum-deprecated-messages"];

  return (property.enum ?? []).map((value) => {
    const option: AnnotationOption = {
      value,
      name: labels?.[value] || value,
    };
    if (deprecated?.[value]) {
      option.deprecated = true;
      const message = messages?.[value];
      if (message) {
        option.deprecationMessage = message;
      }
    }
    return option;
  });
}

export const ACCELERATORS_ANNOTATION =
  "cloud-pipelines.net/launchers/generic/resources.accelerators";

function successorLabel(successor: LauncherAcceleratorSuccessor): string {
  const product = successor.product_label || successor.product;
  const cluster = successor.cluster_label || successor.cluster;
  return `${product} on ${cluster}`;
}

function clusterSuccessorLabel(successor: LauncherClusterSuccessor): string {
  return successor.cluster_label || successor.cluster;
}

function applyAcceleratorCapabilities(
  property: JSONSchemaProperty,
  accelerators: LauncherAcceleratorCapability[],
  now: number,
): JSONSchemaProperty {
  const seen = new Set<string>();
  const enumValues: string[] = [];
  const labels: Record<string, string> = {};
  const deprecated: Record<string, boolean> = {};
  const messages: Record<string, string> = {};
  const successors: Record<string, LauncherAcceleratorSuccessor> = {};

  for (const accelerator of accelerators) {
    if (seen.has(accelerator.product)) {
      continue;
    }
    seen.add(accelerator.product);
    enumValues.push(accelerator.product);

    if (accelerator.label) {
      labels[accelerator.product] = accelerator.label;
    }

    if (accelerator.succeeded_by) {
      successors[accelerator.product] = accelerator.succeeded_by;
    }

    if (accelerator.valid_until && Date.parse(accelerator.valid_until) <= now) {
      deprecated[accelerator.product] = true;
      const name = accelerator.label || accelerator.product;
      const when = accelerator.valid_until.slice(0, 10);
      messages[accelerator.product] = accelerator.succeeded_by
        ? `${name} is no longer available as of ${when}. Use ${successorLabel(accelerator.succeeded_by)} instead.`
        : `${name} is no longer available as of ${when}`;
    }
  }

  const merged: JSONSchemaProperty = {
    ...property,
    enum: enumValues,
    "x-enum-labels": { ...property["x-enum-labels"], ...labels },
  };

  if (Object.keys(successors).length > 0) {
    merged["x-enum-successors"] = {
      ...property["x-enum-successors"],
      ...successors,
    };
  }

  if (Object.keys(deprecated).length > 0) {
    merged["x-enum-deprecated"] = {
      ...property["x-enum-deprecated"],
      ...deprecated,
    };
    merged["x-enum-deprecated-messages"] = {
      ...property["x-enum-deprecated-messages"],
      ...messages,
    };
  }

  return merged;
}

function fieldCapabilityToProperty(
  field: LauncherFieldCapability,
): JSONSchemaProperty {
  const property: JSONSchemaProperty = { type: field.type ?? "string" };

  if (field.label !== undefined) property.title = field.label;
  if (field.description !== undefined) property.description = field.description;
  if (field.min !== undefined) property.inclusiveMinimum = field.min;
  if (field.max !== undefined) property.inclusiveMaximum = field.max;
  if (field.unit !== undefined) property["x-unit"] = field.unit;
  if (field.append !== undefined) property["x-append"] = field.append;
  if (field.enable_quantity) property["x-enable-quantity"] = true;
  if (field.allow_custom_value) property["x-allow-custom-value"] = true;
  if (field.required) property.required = true;
  if (field.enum !== undefined) property.enum = field.enum;
  if (field.enum_labels !== undefined)
    property["x-enum-labels"] = field.enum_labels;

  return property;
}

// Build the whole launcher schema from the backend projection. The projection is
// the single source of truth, so every cluster becomes its own dropdown entry keyed
// by cluster.key, which is also the value persisted as cloud_provider. Visibility is
// backend presence only — no feature-flag-key/x-active is stamped. An aliased value
// still resolves to the cluster through x-aliases, inverted from the projection's
// top-level aliases map.
export function buildLauncherSchemaFromCapabilities(
  capabilities: LauncherCapabilities,
  now: number = Date.now(),
): LauncherAnnotationSchema {
  const launcherSchemas: Record<string, JSONSchemaObject> = {};

  const aliasesByCluster: Record<string, string[]> = {};
  for (const [alias, clusterKey] of Object.entries(
    capabilities.aliases ?? {},
  )) {
    (aliasesByCluster[clusterKey] ??= []).push(alias);
  }

  for (const cluster of capabilities.clusters) {
    const properties: Record<string, JSONSchemaProperty> = {};
    for (const field of cluster.fields) {
      const property = fieldCapabilityToProperty(field);
      properties[field.annotation] =
        field.annotation === ACCELERATORS_ANNOTATION &&
        cluster.accelerators.length > 0
          ? applyAcceleratorCapabilities(property, cluster.accelerators, now)
          : property;
    }

    const object: JSONSchemaObject = {
      type: "object",
      title: cluster.label ?? cluster.key,
      properties,
      "x-provider": cluster.provider_label,
    };
    if (cluster.label) object["x-cluster"] = cluster.label;
    if (cluster.project) object["x-project"] = cluster.project;
    const aliases = aliasesByCluster[cluster.key];
    if (aliases && aliases.length > 0) object["x-aliases"] = aliases;

    if (cluster.succeeded_by) object["x-successor"] = cluster.succeeded_by;

    if (cluster.valid_until && Date.parse(cluster.valid_until) <= now) {
      object["x-deprecated"] = true;
      const name = cluster.label || cluster.key;
      const when = cluster.valid_until.slice(0, 10);
      object["x-deprecated-message"] = cluster.succeeded_by
        ? `${name} is no longer available as of ${when}. Use ${clusterSuccessorLabel(cluster.succeeded_by)} instead.`
        : `${name} is no longer available as of ${when}`;
    }

    launcherSchemas[cluster.key] = object;
  }

  const built: LauncherAnnotationSchema = {
    launcher_annotation_schemas: launcherSchemas,
  };

  if (capabilities.cloud_provider) {
    built.cloud_provider = {
      annotation: capabilities.cloud_provider.annotation,
      type: "string",
      title: capabilities.cloud_provider.label,
    };
  }

  // Common annotations are consumer-specific presentation, so they stay bundled.
  if (launcherTaskAnnotationSchema.common_annotations) {
    built.common_annotations = launcherTaskAnnotationSchema.common_annotations;
  }

  return built;
}

function parseAcceleratorField(
  value: string | undefined,
  key: boolean,
): string {
  try {
    const parsed = JSON.parse(value || "{}");
    const first = Object.keys(parsed)[0];
    return key ? (first ?? "") : String(parsed[first] ?? "");
  } catch {
    return "";
  }
}

export interface ClusterSelection {
  cloudProviderValue: string;
  acceleratorAnnotation?: string;
  acceleratorValue?: string;
}

// Forward direction: turn a chosen cluster entry into the values to persist. The
// cluster key is the persisted cloud_provider value. A cluster that offers GPUs also
// gets an accelerator seeded so the resource is never left unset — the existing
// product is kept when the target still offers it (preserving quantity), otherwise
// the first non-deprecated product is seeded at the existing quantity (or 1).
export function resolveClusterSelection(
  schema: LauncherAnnotationSchema,
  clusterKey: string,
  existingAccelerator?: string,
): ClusterSelection | null {
  const object = schema.launcher_annotation_schemas?.[clusterKey];
  if (!object) return null;

  const cloudProviderValue = clusterKey;
  const gpu = object.properties[ACCELERATORS_ANNOTATION];

  if (!gpu?.enum || gpu.enum.length === 0) {
    return { cloudProviderValue };
  }

  const existingProduct = parseAcceleratorField(existingAccelerator, true);
  const quantity = parseAcceleratorField(existingAccelerator, false) || "1";
  const deprecated = gpu["x-enum-deprecated"] ?? {};
  const product =
    existingProduct && gpu.enum.includes(existingProduct)
      ? existingProduct
      : (gpu.enum.find((value) => !deprecated[value]) ?? gpu.enum[0]);

  return {
    cloudProviderValue,
    acceleratorAnnotation: ACCELERATORS_ANNOTATION,
    acceleratorValue: JSON.stringify({ [product]: quantity }),
  };
}

// Annotation keys to clear when switching from one cluster to another: those the
// previous cluster defined that the next one does not. A Nebius-to-Nebius switch
// therefore keeps the shared accelerator key rather than wiping it (which would
// misroute the task to the default Nebius cluster).
export function clusterAnnotationDiff(
  schema: LauncherAnnotationSchema,
  previousKey: string | undefined,
  nextKey: string | undefined,
): string[] {
  const previous = previousKey
    ? schema.launcher_annotation_schemas?.[previousKey]
    : undefined;
  if (!previous) return [];

  const next = nextKey
    ? schema.launcher_annotation_schemas?.[nextKey]
    : undefined;
  const nextKeys = new Set(Object.keys(next?.properties ?? {}));

  return Object.keys(previous.properties).filter((key) => !nextKeys.has(key));
}

// Annotation key clusters were persisted under before the modern cluster key. A
// pipeline saved by an older client still carries its selection here rather than
// under the projection's cloud_provider annotation.
export const LEGACY_CLOUD_PROVIDER_ANNOTATION =
  "cloud-pipelines.net/orchestration/cloud_provider";

// Reverse resolution for reload: find the cluster key a task currently selects.
// The modern annotation wins; an older pipeline that only wrote the legacy
// annotation still resolves, and an alias on either annotation maps to its cluster
// through x-aliases.
export function resolveSelectedClusterKey(
  schema: LauncherAnnotationSchema,
  annotations: Record<string, unknown>,
): string | undefined {
  const modernKey = schema.cloud_provider?.annotation;
  const raw =
    (modernKey ? annotations[modernKey] : undefined) ??
    annotations[LEGACY_CLOUD_PROVIDER_ANNOTATION];
  const persisted = typeof raw === "string" ? raw : undefined;
  return resolveLauncherKey(schema, persisted);
}
