/**
 * @license
 * Copyright 2022 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2022 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import yaml from "js-yaml";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  buildArgoWorkflowFromGraphComponent,
  type Workflow,
} from "../compilers/Argo/argoCompiler";
import type { ComponentSpec } from "../componentSpec";
import { ensureGoogleCloudAuthorizesScopes } from "./GoogleCloud";

const LOCAL_STORAGE_ENDPOINT_KEY = "KubeflowPipelinesSubmitter/endpoint";
const LOCAL_STORAGE_AUTH_TOKEN_KEY = "KubeflowPipelinesSubmitter/auth_token";

const kfpSubmitPipelineRun = async (
  argoWorkflowSpec: Record<string, any>,
  endpoint: string,
  authToken?: string,
  googleCloudOAuthClientId?: string,
  runName?: string,
) => {
  // https://www.kubeflow.org/docs/components/pipelines/reference/api/kubeflow-pipeline-api-spec/#/definitions/apiRun
  const kfpRun = {
    name: runName ?? argoWorkflowSpec.name ?? "Pipeline",
    pipeline_spec: {
      workflow_manifest: JSON.stringify(argoWorkflowSpec),
    },
  };
  if (!endpoint.includes("://")) {
    console.warn("Endpoint URL does not specify a protocol. Using HTTPS.");
    endpoint = "https://" + endpoint;
  }
  if (!endpoint.endsWith("/")) {
    endpoint = endpoint + "/";
  }
  const apiUrl = endpoint + "apis/v1beta1/runs";
  if (!authToken) {
    // Auth token not specified. Authenticating the request using Google Cloud
    if (googleCloudOAuthClientId) {
      const oauthToken = await ensureGoogleCloudAuthorizesScopes(
        googleCloudOAuthClientId,
        ["https://www.googleapis.com/auth/cloud-platform"],
      );
      authToken = oauthToken?.access_token;
    }
  }
  const response = await fetch(apiUrl, {
    method: "POST",
    body: JSON.stringify(kfpRun),
    headers: new Headers({
      Authorization: "Bearer " + authToken,
    }),
  });
  (window as any).gtag?.(
    "event",
    "KubeflowPipelinesSubmitter_submit_pipeline_run_succeeded",
    {},
  );
  return response.json();
};

const generateKfpRunUrl = (endpoint: string, runId: string) => {
  //https://xxx-dot-us-central2.pipelines.googleusercontent.com/#/runs/details/<runId>
  if (!endpoint.includes("://")) {
    endpoint = "https://" + endpoint;
  }
  if (!endpoint.endsWith("/")) {
    endpoint = endpoint + "/";
  }
  return endpoint + "#/runs/details/" + runId;
};

interface KubeflowPipelinesSubmitterProps {
  componentSpec?: ComponentSpec;
  pipelineArguments?: Map<string, string>;
  googleCloudOAuthClientId?: string;
}

const KubeflowPipelinesSubmitter = ({
  componentSpec,
  pipelineArguments,
  googleCloudOAuthClientId,
}: KubeflowPipelinesSubmitterProps) => {
  const [argoWorkflow, setArgoWorkflow] = useState<Workflow | undefined>(
    undefined,
  );
  const [argoWorkflowYamlBlobUrl, setArgoWorkflowYamlBlobUrl] = useState<
    string | undefined
  >(undefined);
  const [compilationError, setCompilationError] = useState<string | undefined>(
    undefined,
  );
  const [submissionError, setSubmissionError] = useState<string | undefined>(
    undefined,
  );
  const [endpoint, setEndpoint] = useState<string>(
    () => window.localStorage?.getItem(LOCAL_STORAGE_ENDPOINT_KEY) ?? "",
  );
  const [authToken, setAuthToken] = useState<string>(
    () => window.localStorage?.getItem(LOCAL_STORAGE_AUTH_TOKEN_KEY) ?? "",
  );
  const [, setPipelineRunId] = useState<string | undefined>(undefined);
  const [, setWorkflowResourceName] = useState<string | undefined>(undefined);
  const [pipelineRunWebUrl, setPipelineRunWebUrl] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    if (componentSpec !== undefined) {
      try {
        const argoWorkflow = buildArgoWorkflowFromGraphComponent(
          componentSpec,
          pipelineArguments ?? new Map(),
        );
        argoWorkflow.metadata.labels = {
          sdk: "cloud-pipelines-editor",
          "cloud-pipelines.net/pipeline-editor": "true",
          "pipelines.kubeflow.org/pipeline-sdk-type": "cloud-pipelines-editor",
        };
        setArgoWorkflow(argoWorkflow);
        const argoWorkflowYaml = yaml.dump(argoWorkflow, {
          lineWidth: -1, // Don't fold long strings
          quotingType: '"',
        });
        const newArgoWorkflowYamlBlobUrl = URL.createObjectURL(
          new Blob([argoWorkflowYaml], { type: "application/yaml" }),
        );
        // Updating the workflow blob URL (revoking the old workflow blob URL first).
        setArgoWorkflowYamlBlobUrl((currentArgoWorkflowYamlBlobUrl) => {
          if (currentArgoWorkflowYamlBlobUrl !== undefined) {
            URL.revokeObjectURL(currentArgoWorkflowYamlBlobUrl);
          }
          return newArgoWorkflowYamlBlobUrl;
        });
        setCompilationError(undefined);
      } catch (err) {
        const errorMessage =
          typeof err === "object" && err instanceof Error
            ? err.toString()
            : String(err);
        setCompilationError(errorMessage);
      }
    }
  }, [componentSpec, pipelineArguments]);

  const readyToSubmit = endpoint && argoWorkflow;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!endpoint || !argoWorkflow) {
          return;
        }
        setPipelineRunWebUrl(undefined);
        try {
          // setItem might throw exception on iOS in incognito mode
          try {
            window.localStorage?.setItem(LOCAL_STORAGE_ENDPOINT_KEY, endpoint);
            window.localStorage?.setItem(
              LOCAL_STORAGE_AUTH_TOKEN_KEY,
              authToken,
            );
          } catch (err) {
            console.error(
              "KubeflowPipelinesSubmitter: Error writing properties to the localStorage",
              err,
            );
          }
          const runName =
            (componentSpec?.name ?? "Pipeline") +
            " " +
            new Date().toISOString().replace("T", " ").replace("Z", "");
          const result = await kfpSubmitPipelineRun(
            argoWorkflow,
            endpoint,
            authToken,
            googleCloudOAuthClientId,
            runName,
          );
          console.debug(result);
          const runId = result?.run?.id;
          if (typeof runId === "string") {
            setPipelineRunId(runId);
            const runUrl = generateKfpRunUrl(endpoint, runId);
            setPipelineRunWebUrl(runUrl);
          }
          const runtimeWorkflowManifestString =
            result?.pipeline_runtime?.workflow_manifest;
          if (typeof runtimeWorkflowManifestString === "string") {
            const runtimeWorkflowManifest = JSON.parse(
              runtimeWorkflowManifestString,
            );
            const resourceName = runtimeWorkflowManifest?.metadata?.name;
            if (resourceName) {
              setWorkflowResourceName(resourceName);
            }
          }
          setSubmissionError(undefined);
        } catch (err: any) {
          console.error(err);
          const errorMessage =
            typeof err === "object" && err instanceof Error
              ? err.toString()
              : String(err);
          setSubmissionError(errorMessage);
          (window as any).gtag?.(
            "event",
            "KubeflowPipelinesSubmitter_submit_pipeline_run_failed",
            {},
          );
        }
      }}
    >
      <div className="flex flex-row gap-2">
        <Label htmlFor="Endpoint">Endpoint: </Label>
        <Input
          id="Endpoint"
          required
          type="text"
          placeholder="https://xxx.pipelines.googleusercontent.com/"
          title="https://xxx-dot-us-central2.pipelines.googleusercontent.com/"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
        />
      </div>
      <div className="flex flex-row gap-2">
        <Label htmlFor="Token">Token: </Label>
        <Input
          id="Token"
          type="text"
          placeholder="ya29..."
          title="Authorization Bearer token"
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
        />
      </div>
      <div
        style={{
          whiteSpace: "nowrap",
          margin: "5px",
        }}
      >
        <Button type="submit" disabled={!readyToSubmit}>
          Submit pipeline
        </Button>
        {pipelineRunWebUrl && (
          <a
            href={pipelineRunWebUrl}
            target="_blank"
            rel="noreferrer"
            style={{ margin: "5px" }}
          >
            Run
          </a>
        )}
      </div>
      {argoWorkflowYamlBlobUrl && (
        <div
          style={{
            margin: "5px",
          }}
        >
          {/* TODO: Use pipeline name for the file name */}
          Or download the{" "}
          <a href={argoWorkflowYamlBlobUrl} download={"kubeflow_pipeline.yaml"}>
            kubeflow_pipeline.yaml
          </a>
        </div>
      )}
      {compilationError && <div>{compilationError}</div>}
      {submissionError && <div>Error: {submissionError}</div>}
    </form>
  );
};

export default KubeflowPipelinesSubmitter;
