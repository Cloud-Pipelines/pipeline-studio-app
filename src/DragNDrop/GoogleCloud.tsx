/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

/// <reference types="gapi" />
/* global gapi */

import { useEffect, useState } from "react";

import type { ComponentSpec } from "../componentSpec";
import { buildVertexPipelineJobFromGraphComponent } from "../compilers/GoogleCloudVertexAIPipelines/vertexAiCompiler";
import type { PipelineJob } from "../compilers/GoogleCloudVertexAIPipelines/vertexPipelineSpec";

const LOCAL_STORAGE_GCS_OUTPUT_DIRECTORY_KEY =
  "GoogleCloudSubmitter/gcsOutputDirectory";
const LOCAL_STORAGE_PROJECT_ID_KEY = "GoogleCloudSubmitter/projectId";
const LOCAL_STORAGE_REGION_KEY = "GoogleCloudSubmitter/region";
const LOCAL_STORAGE_PROJECT_IDS_KEY = "GoogleCloudSubmitter/projectIds";

const VERTEX_AI_PIPELINES_REGIONS = [
  "us-central1",
  "us-east1",
  "us-west1",
  "europe-west1",
  "europe-west2",
  "europe-west4",
  "asia-east1",
  "asia-southeast1",
  "northamerica-northeast1",
];

const VERTEX_AI_PIPELINES_DEFAULT_REGION = "us-central1";

const authorizeGoogleCloudClient = async (
  clientId: string,
  scopes: string[],
  immediate = false, // Setting immediate to true prevents auth window showing every time. But it needs to be false the first time (when cookies are not set).
) => {
  return new Promise<GoogleApiOAuth2TokenObject>((resolve, reject) => {
    gapi.auth.authorize(
      {
        client_id: clientId,
        scope: scopes,
        immediate: immediate,
      },
      (authResult) => {
        // console.debug("authorizeGoogleCloudClient: called back");
        if (authResult === undefined) {
          console.error("authorizeGoogleCloudClient failed");
          reject("gapi.auth.authorize result is undefined");
        } else if (authResult.error) {
          console.error("authorizeGoogleCloudClient failed", authResult.error);
          reject(authResult.error);
        } else {
          // console.debug("authorizeGoogleCloudClient: Success");
          // Working around the Google Auth bug: The request succeeds, but the returned token does not have the requested scopes.
          // See https://github.com/google/google-api-javascript-client/issues/743
          const receivedScopesString = (authResult as any).scope as
            | string
            | undefined;
          const receivedScopes = receivedScopesString?.split(" ");
          if (
            receivedScopes === undefined ||
            !scopes.every((scope) => receivedScopes.includes(scope))
          ) {
            const errorMessage = `Authorization call succeeded, but the returned scopes are ${receivedScopesString}`;
            console.error(errorMessage);
            reject(errorMessage);
          } else {
            resolve(authResult);
          }
        }
      },
    );
  });
};

export const ensureGoogleCloudAuthorizesScopes = async (
  googleCloudOAuthClientId: string,
  scopes: string[],
) => {
  try {
    // console.debug('Before ensureGoogleCloudAuthorizesScopes(immediate=true)');
    const oauthToken = await authorizeGoogleCloudClient(
      googleCloudOAuthClientId,
      scopes,
      true,
    );
    // console.debug('After ensureGoogleCloudAuthorizesScopes(immediate=true)');
    (window as any).gtag?.("event", "GoogleCloud_auth", {
      result: "succeeded",
      immediate: "true",
    });
    return oauthToken;
  } catch {
    try {
      const oauthToken = await authorizeGoogleCloudClient(
        googleCloudOAuthClientId,
        scopes,
        false,
      );
      (window as any).gtag?.("event", "GoogleCloud_auth", {
        result: "succeeded",
        immediate: "false",
      });
      return oauthToken;
    } catch {
      // console.error('ensureGoogleCloudAuthorizesScopes(immediate=false)', err);
      (window as any).gtag?.("event", "GoogleCloud_auth", {
        result: "failed",
        immediate: "false",
      });
    }
  }
};

const cloudresourcemanagerListProjects = async (
  googleCloudOAuthClientId: string,
) => {
  await ensureGoogleCloudAuthorizesScopes(googleCloudOAuthClientId, [
    "https://www.googleapis.com/auth/cloud-platform",
  ]);
  const response = await gapi.client.request({
    path: "https://cloudresourcemanager.googleapis.com/v1/projects/",
  });
  return response.result;
};

const aiplatformCreatePipelineJob = async (
  projectId: string,
  region = "us-central1",
  pipelineJob: Record<string, any>,
  googleCloudOAuthClientId: string,
  pipelineJobId?: string,
) => {
  await ensureGoogleCloudAuthorizesScopes(googleCloudOAuthClientId, [
    "https://www.googleapis.com/auth/cloud-platform",
  ]);
  const response = await gapi.client.request({
    path: `https://${region}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${region}/pipelineJobs?pipelineJobId=${pipelineJobId}`,
    method: "POST",
    body: JSON.stringify(pipelineJob),
  });
  (window as any).gtag?.("event", "GoogleCloud_submit_pipeline_job", {
    result: "succeeded",
  });
  return response.result;
};

interface GoogleCloudSubmitterProps {
  componentSpec?: ComponentSpec;
  pipelineArguments?: Map<string, string>;
  googleCloudOAuthClientId: string;
}

const GoogleCloudSubmitter = ({
  componentSpec,
  pipelineArguments,
  googleCloudOAuthClientId,
}: GoogleCloudSubmitterProps) => {
  const [projects, setProjects] = useState<string[]>(() =>
    JSON.parse(
      window.localStorage?.getItem(LOCAL_STORAGE_PROJECT_IDS_KEY) ?? "[]",
    ),
  );
  const [project, setProject] = useState<string>(
    () => window.localStorage?.getItem(LOCAL_STORAGE_PROJECT_ID_KEY) ?? "",
  ); // undefined causes error: https://reactjs.org/docs/forms.html#controlled-components https://stackoverflow.com/a/47012342
  const [region, setRegion] = useState(
    () =>
      window.localStorage?.getItem(LOCAL_STORAGE_REGION_KEY) ??
      VERTEX_AI_PIPELINES_DEFAULT_REGION,
  );
  const [error, setError] = useState("");
  const [gcsOutputDirectory, setGcsOutputDirectory] = useState(
    () =>
      window.localStorage?.getItem(LOCAL_STORAGE_GCS_OUTPUT_DIRECTORY_KEY) ??
      "",
  );
  const [pipelineJobWebUrl, setPipelineJobWebUrl] = useState<
    string | undefined
  >(undefined);
  const [compilationError, setCompilationError] = useState<string | undefined>(
    undefined,
  );
  const [vertexPipelineJob, setVertexPipelineJob] = useState<
    PipelineJob | undefined
  >(undefined);
  const [vertexPipelineJsonBlobUrl, setVertexPipelineJsonBlobUrl] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    if (componentSpec !== undefined) {
      try {
        const vertexPipelineJob = buildVertexPipelineJobFromGraphComponent(
          componentSpec,
          gcsOutputDirectory,
          pipelineArguments,
        );
        setCompilationError(undefined);
        vertexPipelineJob.labels = {
          sdk: "cloud-pipelines-editor",
          "cloud-pipelines-editor-version": "0-0-1",
        };
        setVertexPipelineJob(vertexPipelineJob);
        const vertexPipelineJobJson = JSON.stringify(
          vertexPipelineJob,
          undefined,
          2,
        );
        const vertexPipelineJsonBlobUrl = URL.createObjectURL(
          new Blob([vertexPipelineJobJson], { type: "application/json" }),
        );
        setVertexPipelineJsonBlobUrl(vertexPipelineJsonBlobUrl);
      } catch (err) {
        const errorMessage =
          typeof err === "object" && err instanceof Error
            ? err.toString()
            : String(err);
        setCompilationError(errorMessage);
        setVertexPipelineJob(undefined);
        setVertexPipelineJsonBlobUrl(undefined);
      }
    }
  }, [componentSpec, pipelineArguments, gcsOutputDirectory]);

  const readyToSubmit =
    project !== "" && region !== "" && vertexPipelineJob !== undefined;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (vertexPipelineJob === undefined) {
          return;
        }
        setPipelineJobWebUrl(undefined);
        try {
          // setItem might throw exception on iOS in incognito mode
          try {
            window.localStorage?.setItem(
              LOCAL_STORAGE_GCS_OUTPUT_DIRECTORY_KEY,
              gcsOutputDirectory,
            );
            window.localStorage?.setItem(LOCAL_STORAGE_PROJECT_ID_KEY, project);
            window.localStorage?.setItem(LOCAL_STORAGE_REGION_KEY, region);
          } catch (err) {
            console.error(
              "GoogleCloudSubmitter: Error writing properties to the localStorage",
              err,
            );
          }
          const displayName = (
            (componentSpec?.name ?? "Pipeline") +
            " " +
            new Date().toISOString().replace("T", " ").replace("Z", "")
          ).substring(0, 127);
          const desiredPipelineJobId = displayName
            .toLowerCase()
            .replace(/[^-a-z0-9]/g, "-")
            .replace(/^-+/, ""); // No leading dashes
          vertexPipelineJob.displayName = displayName;
          const result = await aiplatformCreatePipelineJob(
            project,
            region,
            vertexPipelineJob,
            googleCloudOAuthClientId,
            desiredPipelineJobId,
          );
          const pipelineJobName: string = result.name;
          const pipelineJobId = pipelineJobName.split("/").slice(-1)[0];
          const pipelineJobWebUrl = `https://console.cloud.google.com/vertex-ai/locations/${region}/pipelines/runs/${pipelineJobId}?project=${project}`;
          setPipelineJobWebUrl(pipelineJobWebUrl);
          setError("");
        } catch (err: any) {
          console.error(err);
          setError(err?.result?.error?.message ?? "Error");
          (window as any).gtag?.("event", "GoogleCloud_submit_pipeline_job", {
            result: "failed",
          });
        }
      }}
    >
      <div
        style={{
          whiteSpace: "nowrap",
          margin: "5px",
        }}
      >
        <label htmlFor="project">Project: </label>
        <input
          id="project"
          required
          type="text"
          list="projects"
          placeholder="<my-project-id>"
          value={project}
          onChange={(e) => setProject(e.target.value)}
        />
        <datalist id="projects">
          {projects.map((projectId) => (
            <option key={projectId} value={projectId} />
          ))}
        </datalist>
        <button
          type="button" // The default button type is "submit", not "button". WTF!?
          onClick={async () => {
            try {
              const result = await cloudresourcemanagerListProjects(
                googleCloudOAuthClientId,
              );
              const projectIds = (result.projects as any[]).map<string>(
                (projectInfo) => projectInfo.projectId,
              );
              setProjects(projectIds);
              setError("");
              try {
                window.localStorage?.setItem(
                  LOCAL_STORAGE_PROJECT_IDS_KEY,
                  JSON.stringify(projectIds),
                );
              } catch (err) {
                console.error(
                  "GoogleCloudSubmitter: Error writing properties to the localStorage",
                  err,
                );
              }
              (window as any).gtag?.("event", "GoogleCloud_list_projects", {
                result: "succeeded",
              });
            } catch (err: any) {
              console.error(err);
              setError(err?.result?.error?.message ?? "Error");
              (window as any).gtag?.("event", "GoogleCloud_list_projects", {
                result: "failed",
              });
            }
          }}
        >
          ⟳{/* 🗘⭯ ⭮ ↺ ↻ ⟲ ⟳ 🔃🔄 */}
        </button>
      </div>
      <div
        style={{
          whiteSpace: "nowrap",
          margin: "5px",
        }}
      >
        <label htmlFor="region">Region: </label>
        <input
          id="region"
          required
          type="text"
          list="regions"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
        <datalist id="regions">
          {VERTEX_AI_PIPELINES_REGIONS.map((region) => (
            <option key={region} value={region} />
          ))}
        </datalist>
      </div>
      <div
        style={{
          whiteSpace: "nowrap",
          margin: "5px",
        }}
      >
        <label htmlFor="region">GCS dir: </label>
        <input
          id="gcsOutputDirectory"
          required
          type="text"
          value={gcsOutputDirectory}
          onChange={(e) => setGcsOutputDirectory(e.target.value)}
        />
      </div>
      <div
        style={{
          whiteSpace: "nowrap",
          margin: "5px",
        }}
      >
        <input
          type="submit"
          disabled={!readyToSubmit}
          value="Submit pipeline job"
        />
        {pipelineJobWebUrl && (
          <a
            href={pipelineJobWebUrl}
            target="_blank"
            rel="noreferrer"
            style={{ margin: "5px" }}
          >
            Job
          </a>
        )}
      </div>
      {vertexPipelineJsonBlobUrl !== undefined && (
        <div
          style={{
            margin: "5px",
          }}
        >
          Or download the{" "}
          <a
            href={vertexPipelineJsonBlobUrl}
            download={"vertex_pipeline_job.json"}
          >
            pipeline_job.json
          </a>{" "}
          file, then go to{" "}
          <a href="https://console.cloud.google.com/vertex-ai/pipelines">
            Vertex Pipelines
          </a>{" "}
          and{" "}
          <a href="https://cloud.google.com/vertex-ai/docs/pipelines/run-pipeline#console">
            create a new run
          </a>
          .
        </div>
      )}
      {compilationError && <div>{compilationError}</div>}
      {error && <div>Error: {error}</div>}
    </form>
  );
};

export default GoogleCloudSubmitter;
