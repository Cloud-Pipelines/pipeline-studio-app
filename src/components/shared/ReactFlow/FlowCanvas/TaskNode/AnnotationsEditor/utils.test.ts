import { beforeEach, describe, expect, it, vi } from "vitest";

import { isFlagEnabled } from "@/components/shared/Settings/useFlags";

import {
  ACCELERATORS_ANNOTATION,
  buildLauncherSchemaFromCapabilities,
  clusterAnnotationDiff,
  getCloudProviderConfig,
  getProviderSchema,
  type LauncherCapabilities,
  type LauncherClusterCapability,
  parseSchemaToAnnotationConfig,
  resolveClusterSelection,
  resolveLauncherKey,
  resolveSelectedClusterKey,
} from "./utils";

vi.mock("@/components/shared/Settings/useFlags", () => ({
  isFlagEnabled: vi.fn(),
}));

const CLOUD_PROVIDER_ANNOTATION =
  "cloud-pipelines.net/orchestration/cloud_provider";

const makeSchema = (
  launchers: Record<string, Record<string, unknown>>,
  cloudProvider: Record<string, unknown> = {},
) => ({
  cloud_provider: {
    type: "string",
    annotation: CLOUD_PROVIDER_ANNOTATION,
    ...cloudProvider,
  },
  launcher_annotation_schemas: Object.fromEntries(
    Object.entries(launchers).map(([key, extra]) => [
      key,
      { type: "object", properties: {}, ...extra },
    ]),
  ),
});

beforeEach(() => {
  vi.mocked(isFlagEnabled).mockReturnValue(true);
});

describe("getCloudProviderConfig", () => {
  it("returns null when cloud_provider or launcher schemas are missing", () => {
    expect(getCloudProviderConfig({ launcher_annotation_schemas: {} })).toBe(
      null,
    );
    expect(
      getCloudProviderConfig({
        cloud_provider: {
          type: "string",
          annotation: CLOUD_PROVIDER_ANNOTATION,
        },
      }),
    ).toBe(null);
  });

  it("derives options from launcher keys with title as the display name", () => {
    const config = getCloudProviderConfig(
      makeSchema({
        "ml-offline-us-ce1-eo9": { title: "eo9" },
      }),
    );

    expect(config?.annotation).toBe(CLOUD_PROVIDER_ANNOTATION);
    expect(config?.options).toEqual([
      { value: "ml-offline-us-ce1-eo9", name: "eo9" },
    ]);
  });

  it("hides an option when its feature flag is disabled", () => {
    vi.mocked(isFlagEnabled).mockImplementation(
      (flag) => flag !== "eo9-launcher",
    );

    const config = getCloudProviderConfig(
      makeSchema({
        google: { title: "Google Cloud" },
        "ml-offline-us-ce1-eo9": {
          title: "eo9",
          "feature-flag-key": "eo9-launcher",
        },
      }),
    );

    expect(config?.options?.map((o) => o.value)).toEqual(["google"]);
  });

  it("shows a flagged option when its feature flag is enabled", () => {
    vi.mocked(isFlagEnabled).mockReturnValue(true);

    const config = getCloudProviderConfig(
      makeSchema({
        "ml-offline-us-ce1-eo9": {
          title: "eo9",
          "feature-flag-key": "eo9-launcher",
        },
      }),
    );

    expect(config?.options?.map((o) => o.value)).toEqual([
      "ml-offline-us-ce1-eo9",
    ]);
  });

  it("hides an option with x-active false regardless of an enabled flag", () => {
    vi.mocked(isFlagEnabled).mockReturnValue(true);

    const config = getCloudProviderConfig(
      makeSchema({
        google: { title: "Google Cloud" },
        davies: {
          title: "Davies",
          "feature-flag-key": "davies-launcher",
          "x-active": false,
        },
      }),
    );

    expect(config?.options?.map((o) => o.value)).toEqual(["google"]);
  });

  it("requires both x-active and the feature flag to show an option", () => {
    const schema = makeSchema({
      gated: {
        title: "Gated",
        "feature-flag-key": "gated-launcher",
        "x-active": true,
      },
    });

    vi.mocked(isFlagEnabled).mockReturnValue(false);
    expect(getCloudProviderConfig(schema)?.options).toEqual([]);

    vi.mocked(isFlagEnabled).mockReturnValue(true);
    expect(
      getCloudProviderConfig(schema)?.options?.map((o) => o.value),
    ).toEqual(["gated"]);
  });

  it("marks a launcher option deprecated with its message", () => {
    const config = getCloudProviderConfig(
      makeSchema({
        legacy: {
          title: "Legacy",
          "x-deprecated": true,
          "x-deprecated-message": "Use eo9 instead",
        },
      }),
    );

    expect(config?.options?.[0]).toEqual({
      value: "legacy",
      name: "Legacy",
      deprecated: true,
      deprecationMessage: "Use eo9 instead",
    });
  });

  it("populates provider, project, and cluster from x- fields", () => {
    const config = getCloudProviderConfig(
      makeSchema({
        "ml-offline-us-ce1-eo9": {
          title: "eo9",
          "x-provider": "Google GKE",
          "x-project": "shopify-ml-offline-prod",
          "x-cluster": "ml-offline-us-ce1-eo9",
        },
      }),
    );

    expect(config?.options?.[0]).toEqual({
      value: "ml-offline-us-ce1-eo9",
      name: "eo9",
      provider: "Google GKE",
      project: "shopify-ml-offline-prod",
      cluster: "ml-offline-us-ce1-eo9",
    });
  });

  it("carries deprecation through the enum path via x-enum-deprecated", () => {
    const config = getCloudProviderConfig(
      makeSchema(
        { google: {} },
        {
          enum: ["google", "legacy"],
          "x-enum-labels": { legacy: "Legacy" },
          "x-enum-deprecated": { legacy: true },
          "x-enum-deprecated-messages": { legacy: "Being retired" },
        },
      ),
    );

    expect(config?.options).toEqual([
      { value: "google", name: "google" },
      {
        value: "legacy",
        name: "Legacy",
        deprecated: true,
        deprecationMessage: "Being retired",
      },
    ]);
  });
});

describe("parseSchemaToAnnotationConfig", () => {
  it("marks enum options deprecated from x-enum-deprecated", () => {
    const [config] = parseSchemaToAnnotationConfig({
      type: "object",
      properties: {
        tier: {
          type: "string",
          enum: ["standard", "old"],
          "x-enum-deprecated": { old: true },
        },
      },
    });

    expect(config.options).toEqual([
      { value: "standard", name: "standard" },
      { value: "old", name: "old", deprecated: true },
    ]);
  });
});

describe("resolveLauncherKey", () => {
  const schema = makeSchema({
    "ml-offline-us-ce1-lt3": { "x-aliases": ["google"] },
    "ml-offline-us-ce1-eo9": {},
  });

  it("returns a current launcher key unchanged", () => {
    expect(resolveLauncherKey(schema, "ml-offline-us-ce1-lt3")).toBe(
      "ml-offline-us-ce1-lt3",
    );
  });

  it("maps a legacy key to its current launcher key", () => {
    expect(resolveLauncherKey(schema, "google")).toBe("ml-offline-us-ce1-lt3");
  });

  it("returns an unknown value unchanged", () => {
    expect(resolveLauncherKey(schema, "azure")).toBe("azure");
  });

  it("passes through empty or missing values", () => {
    expect(resolveLauncherKey(schema, "")).toBe("");
    expect(resolveLauncherKey(schema, undefined)).toBe(undefined);
    expect(
      resolveLauncherKey({ launcher_annotation_schemas: {} }, "google"),
    ).toBe("google");
  });
});

describe("getProviderSchema", () => {
  const schema = makeSchema({
    "ml-offline-us-ce1-lt3": {
      "x-aliases": ["google"],
      properties: { cpu: { type: "string" } },
    },
  });

  it("resolves a legacy key to the current launcher's schema", () => {
    expect(getProviderSchema(schema, "google")).toBe(
      schema.launcher_annotation_schemas["ml-offline-us-ce1-lt3"],
    );
  });

  it("returns null for an unknown provider", () => {
    expect(getProviderSchema(schema, "azure")).toBe(null);
  });

  it("returns null when no provider is given", () => {
    expect(getProviderSchema(schema, undefined)).toBe(null);
  });
});

const cluster = (
  overrides: Partial<LauncherClusterCapability> & { key: string },
): LauncherClusterCapability => ({
  provider_label: "Nebius Managed K8s",
  label: null,
  project: null,
  default: null,
  accelerators: [],
  fields: [],
  ...overrides,
});

const gpuField = { annotation: ACCELERATORS_ANNOTATION, label: "GPU" };

const gkeCluster = (key: string) =>
  cluster({
    key,
    provider_label: "Google GKE",
    label: key,
    project: "shopify-ml-offline-prod",
    fields: [
      {
        annotation: "cloud-pipelines.net/launchers/generic/resources.cpu",
        label: "CPU",
        type: "number",
      },
    ],
  });

const nebiusCluster = (
  key: string,
  accelerators: LauncherClusterCapability["accelerators"],
) =>
  cluster({
    key,
    provider_label: "Nebius Managed K8s",
    label: `${key} cluster`,
    accelerators,
    fields: [gpuField],
  });

const H200 = {
  product: "NVIDIA-H200",
  label: "NVIDIA H200",
  valid_until: null,
};
const B300 = {
  product: "NVIDIA-B300-SXM6-PC",
  label: "NVIDIA B300",
  valid_until: null,
};

const withCloudProvider = (
  clusters: LauncherClusterCapability[],
  aliases?: Record<string, string>,
): LauncherCapabilities => ({
  cloud_provider: {
    annotation: CLOUD_PROVIDER_ANNOTATION,
    label: "Cloud Provider",
  },
  aliases,
  clusters,
});

describe("buildLauncherSchemaFromCapabilities", () => {
  it("emits one launcher entry per cluster keyed by cluster.key", () => {
    const built = buildLauncherSchemaFromCapabilities(
      withCloudProvider([
        gkeCluster("lt3"),
        gkeCluster("eo9"),
        nebiusCluster("h200", [H200]),
      ]),
    );

    expect(Object.keys(built.launcher_annotation_schemas ?? {})).toEqual([
      "lt3",
      "eo9",
      "h200",
    ]);
    expect(built.cloud_provider).toEqual({
      annotation: CLOUD_PROVIDER_ANNOTATION,
      type: "string",
      title: "Cloud Provider",
    });
  });

  it("copies cluster fields into properties verbatim and synthesizes the Nebius GPU enum", () => {
    const built = buildLauncherSchemaFromCapabilities(
      withCloudProvider([
        gkeCluster("eo9"),
        nebiusCluster("h200", [H200, B300]),
      ]),
    );

    const gke = built.launcher_annotation_schemas?.eo9;
    expect(Object.keys(gke?.properties ?? {})).toEqual([
      "cloud-pipelines.net/launchers/generic/resources.cpu",
    ]);
    expect(gke?.properties[ACCELERATORS_ANNOTATION]).toBeUndefined();
    expect(gke?.["x-provider"]).toBe("Google GKE");
    expect(gke?.["x-project"]).toBe("shopify-ml-offline-prod");

    const gpu =
      built.launcher_annotation_schemas?.h200.properties[
        ACCELERATORS_ANNOTATION
      ];
    expect(gpu?.enum).toEqual(["NVIDIA-H200", "NVIDIA-B300-SXM6-PC"]);
    expect(gpu?.["x-enum-labels"]).toEqual({
      "NVIDIA-H200": "NVIDIA H200",
      "NVIDIA-B300-SXM6-PC": "NVIDIA B300",
    });
  });

  it("marks an accelerator past its valid_until as deprecated", () => {
    const built = buildLauncherSchemaFromCapabilities(
      withCloudProvider([
        nebiusCluster("h200", [
          { ...H200, valid_until: "2020-01-01T00:00:00Z" },
        ]),
      ]),
    );

    const gpu =
      built.launcher_annotation_schemas?.h200.properties[
        ACCELERATORS_ANNOTATION
      ];
    expect(gpu?.["x-enum-deprecated"]).toEqual({ "NVIDIA-H200": true });
    expect(gpu?.["x-enum-deprecated-messages"]?.["NVIDIA-H200"]).toBe(
      "NVIDIA H200 is no longer available as of 2020-01-01",
    );
  });

  it("folds an accelerator successor into the deprecation message and stashes the pointer", () => {
    const successor = {
      cluster: "b300",
      cluster_label: "Nebius B300 cluster",
      product: "NVIDIA-B300-SXM6-PC",
      product_label: "NVIDIA B300",
    };
    const built = buildLauncherSchemaFromCapabilities(
      withCloudProvider([
        nebiusCluster("h200", [
          {
            ...H200,
            valid_until: "2020-01-01T00:00:00Z",
            succeeded_by: successor,
          },
        ]),
      ]),
    );

    const gpu =
      built.launcher_annotation_schemas?.h200.properties[
        ACCELERATORS_ANNOTATION
      ];
    expect(gpu?.["x-enum-deprecated-messages"]?.["NVIDIA-H200"]).toBe(
      "NVIDIA H200 is no longer available as of 2020-01-01. Use NVIDIA B300 on Nebius B300 cluster instead.",
    );
    expect(gpu?.["x-enum-successors"]?.["NVIDIA-H200"]).toEqual(successor);
  });

  it("marks a cluster past its valid_until as deprecated and points at the successor", () => {
    const successor = { cluster: "b300", cluster_label: "B300 cluster" };
    const built = buildLauncherSchemaFromCapabilities(
      withCloudProvider([
        cluster({
          key: "h200",
          provider_label: "Nebius Managed K8s",
          label: "H200 cluster",
          valid_until: "2020-01-01T00:00:00Z",
          succeeded_by: successor,
        }),
      ]),
    );

    const entry = built.launcher_annotation_schemas?.h200;
    expect(entry?.["x-deprecated"]).toBe(true);
    expect(entry?.["x-deprecated-message"]).toBe(
      "H200 cluster is no longer available as of 2020-01-01. Use B300 cluster instead.",
    );
    expect(entry?.["x-successor"]).toEqual(successor);
  });

  it("inverts aliases into per-cluster x-aliases and stamps no feature flag", () => {
    const built = buildLauncherSchemaFromCapabilities(
      withCloudProvider([gkeCluster("lt3")], { google: "lt3" }),
    );

    const lt3 = built.launcher_annotation_schemas?.lt3;
    expect(lt3?.["x-aliases"]).toEqual(["google"]);
    expect(lt3?.["feature-flag-key"]).toBeUndefined();
    expect(lt3?.["x-active"]).toBeUndefined();
  });

  it("falls back to the key as the title and stays selectable with no fields", () => {
    const built = buildLauncherSchemaFromCapabilities(
      withCloudProvider([cluster({ key: "ce7", provider_label: "Nebius" })]),
    );

    const entry = built.launcher_annotation_schemas?.ce7;
    expect(entry?.title).toBe("ce7");
    expect(entry?.properties).toEqual({});
    expect(getCloudProviderConfig(built)?.options?.map((o) => o.value)).toEqual(
      ["ce7"],
    );
  });
});

describe("resolveClusterSelection", () => {
  const schema = buildLauncherSchemaFromCapabilities(
    withCloudProvider([gkeCluster("eo9"), nebiusCluster("h200", [H200, B300])]),
  );

  it("returns null for an unknown cluster", () => {
    expect(resolveClusterSelection(schema, "nope")).toBe(null);
  });

  it("persists only the key for a GKE cluster with no GPUs", () => {
    expect(resolveClusterSelection(schema, "eo9")).toEqual({
      cloudProviderValue: "eo9",
    });
  });

  it("seeds the first product at quantity 1 for a Nebius cluster", () => {
    expect(resolveClusterSelection(schema, "h200")).toEqual({
      cloudProviderValue: "h200",
      acceleratorAnnotation: ACCELERATORS_ANNOTATION,
      acceleratorValue: JSON.stringify({ "NVIDIA-H200": "1" }),
    });
  });

  it("keeps the existing product and quantity when the target still offers it", () => {
    expect(
      resolveClusterSelection(
        schema,
        "h200",
        JSON.stringify({ "NVIDIA-B300-SXM6-PC": "4" }),
      ),
    ).toEqual({
      cloudProviderValue: "h200",
      acceleratorAnnotation: ACCELERATORS_ANNOTATION,
      acceleratorValue: JSON.stringify({ "NVIDIA-B300-SXM6-PC": "4" }),
    });
  });

  it("reseeds when the existing product is not offered by the target", () => {
    const single = buildLauncherSchemaFromCapabilities(
      withCloudProvider([nebiusCluster("b300", [B300])]),
    );

    expect(
      resolveClusterSelection(
        single,
        "b300",
        JSON.stringify({ "NVIDIA-H200": "2" }),
      ),
    ).toEqual({
      cloudProviderValue: "b300",
      acceleratorAnnotation: ACCELERATORS_ANNOTATION,
      acceleratorValue: JSON.stringify({ "NVIDIA-B300-SXM6-PC": "2" }),
    });
  });
});

describe("clusterAnnotationDiff", () => {
  const schema = buildLauncherSchemaFromCapabilities(
    withCloudProvider([gkeCluster("eo9"), nebiusCluster("h200", [H200])]),
  );

  it("excludes the shared accelerator on a Nebius-to-Nebius switch", () => {
    const twoNebius = buildLauncherSchemaFromCapabilities(
      withCloudProvider([
        nebiusCluster("h200", [H200]),
        nebiusCluster("b300", [B300]),
      ]),
    );

    expect(clusterAnnotationDiff(twoNebius, "h200", "b300")).toEqual([]);
  });

  it("includes the accelerator when switching from Nebius to GKE", () => {
    expect(clusterAnnotationDiff(schema, "h200", "eo9")).toEqual([
      ACCELERATORS_ANNOTATION,
    ]);
  });

  it("returns nothing when the previous cluster is unknown", () => {
    expect(clusterAnnotationDiff(schema, undefined, "eo9")).toEqual([]);
  });
});

describe("resolveSelectedClusterKey", () => {
  const MODERN_CLUSTER_ANNOTATION = "tangleml.com/orchestration/cluster";
  const schema = buildLauncherSchemaFromCapabilities({
    cloud_provider: {
      annotation: MODERN_CLUSTER_ANNOTATION,
      label: "Cloud Provider",
    },
    aliases: { google: "lt3", nebius: "h200" },
    clusters: [
      gkeCluster("lt3"),
      gkeCluster("eo9"),
      nebiusCluster("h200", [H200]),
    ],
  });

  it("reads the cluster key from the modern annotation", () => {
    expect(
      resolveSelectedClusterKey(schema, { [MODERN_CLUSTER_ANNOTATION]: "eo9" }),
    ).toBe("eo9");
  });

  it("falls back to the legacy annotation when the modern one is absent", () => {
    expect(
      resolveSelectedClusterKey(schema, {
        [CLOUD_PROVIDER_ANNOTATION]: "h200",
      }),
    ).toBe("h200");
  });

  it("resolves an alias to its cluster key from either annotation", () => {
    expect(
      resolveSelectedClusterKey(schema, {
        [CLOUD_PROVIDER_ANNOTATION]: "google",
      }),
    ).toBe("lt3");
    expect(
      resolveSelectedClusterKey(schema, {
        [MODERN_CLUSTER_ANNOTATION]: "nebius",
      }),
    ).toBe("h200");
  });

  it("prefers the modern annotation over a stale legacy annotation", () => {
    expect(
      resolveSelectedClusterKey(schema, {
        [MODERN_CLUSTER_ANNOTATION]: "eo9",
        [CLOUD_PROVIDER_ANNOTATION]: "google",
      }),
    ).toBe("eo9");
  });

  it("returns undefined when no selection is persisted", () => {
    expect(resolveSelectedClusterKey(schema, {})).toBe(undefined);
  });

  it("passes an unknown value through unchanged", () => {
    expect(
      resolveSelectedClusterKey(schema, {
        [MODERN_CLUSTER_ANNOTATION]: "azure",
      }),
    ).toBe("azure");
  });
});
