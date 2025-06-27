/// <reference types="gapi" />
/* global gapi */

import { useCallback, useEffect, useMemo, useState } from "react";

import { buildVertexPipelineJobFromGraphComponent } from "@/components/shared/Submitters/GoogleCloud/compiler/vertexAiCompiler";
import type { PipelineJob } from "@/components/shared/Submitters/GoogleCloud/compiler/vertexPipelineSpec";
import type { ComponentSpec } from "@/utils/componentSpec";

import useToastNotification from "./useToastNotification";

const LOCAL_STORAGE_GCS_OUTPUT_DIRECTORY_KEY =
  "GoogleCloudSubmitter/gcsOutputDirectory";
const LOCAL_STORAGE_PROJECT_ID_KEY = "GoogleCloudSubmitter/projectId";
const LOCAL_STORAGE_REGION_KEY = "GoogleCloudSubmitter/region";
const LOCAL_STORAGE_PROJECT_IDS_KEY = "GoogleCloudSubmitter/projectIds";

const VERTEX_AI_PIPELINES_DEFAULT_REGION = "us-central1";

interface useGoogleCloudSubmitterProps {
  componentSpec?: ComponentSpec;
}

export type GoogleCloudProject = {
  id: string;
  region: string;
  gcsOutputDirectory: string;
  googleCloudOAuthClientId: string;
};

export const useGoogleCloudSubmitter = ({
  componentSpec,
}: useGoogleCloudSubmitterProps) => {
  const notify = useToastNotification();

  const { projects: initialCloudProjects, ...details } =
    getDetailsFromLocalStorage();

  const [project, setProject] = useState<GoogleCloudProject>(details);

  const [cloudProjects, setCloudProjects] =
    useState<string[]>(initialCloudProjects);

  const [vertexPipelineJob, setVertexPipelineJob] = useState<PipelineJob>();
  const [jobWebUrl, setJobWebUrl] = useState<string>();
  const [jsonBlobUrl, setJsonBlobUrl] = useState<string>();

  const [error, setError] = useState<string>();

  const argumentInputs = useMemo(
    () =>
      componentSpec?.inputs?.map((input) => ({
        key: input.name,
        value: "",
        initialValue: "",
        inputSpec: input,
        isRemoved: false,
      })) ?? [],
    [componentSpec?.inputs],
  );

  const pipelineArguments = useMemo(
    () =>
      new Map(
        argumentInputs
          .filter((arg) => typeof arg.value === "string")
          .map((arg) => [arg.key, arg.value as string]),
      ),
    [argumentInputs],
  );

  const isValid = useMemo(
    () =>
      !!project.id &&
      !!project.region &&
      !!project.gcsOutputDirectory &&
      !!project.googleCloudOAuthClientId &&
      vertexPipelineJob !== undefined,
    [project, vertexPipelineJob],
  );

  const updateProject = useCallback(
    (projectPartial: Partial<GoogleCloudProject>) => {
      setProject((prevProject) => ({
        ...prevProject,
        ...projectPartial,
      }));
    },
    [],
  );

  const refreshProjectList = useCallback(async () => {
    try {
      const result = await cloudresourcemanagerListProjects(
        project.googleCloudOAuthClientId,
      );
      const projectIds = (result.projects as any[]).map<string>(
        (projectInfo) => projectInfo.projectId,
      );
      setCloudProjects(projectIds);
      setError(undefined);
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
      const message = err?.result?.error?.message ?? "Error";
      setError(message);
      notify(message, "error");
      (window as any).gtag?.("event", "GoogleCloud_list_projects", {
        result: "failed",
      });
    }
  }, [project.googleCloudOAuthClientId]);

  const submit = useCallback(async () => {
    if (vertexPipelineJob === undefined) {
      return;
    }
    try {
      // setItem might throw exception on iOS in incognito mode
      try {
        window.localStorage?.setItem(
          LOCAL_STORAGE_GCS_OUTPUT_DIRECTORY_KEY,
          project.gcsOutputDirectory,
        );
        window.localStorage?.setItem(LOCAL_STORAGE_PROJECT_ID_KEY, project.id);
        window.localStorage?.setItem(LOCAL_STORAGE_REGION_KEY, project.region);
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
        project.id,
        project.region,
        vertexPipelineJob,
        project.googleCloudOAuthClientId,
        desiredPipelineJobId,
      );
      const pipelineJobName: string = result.name;
      const pipelineJobId = pipelineJobName.split("/").slice(-1)[0];
      const pipelineJobWebUrl = `https://console.cloud.google.com/vertex-ai/locations/${project.region}/pipelines/runs/${pipelineJobId}?project=${project}`;
      setJobWebUrl(pipelineJobWebUrl);
      setError(undefined);
    } catch (err: any) {
      console.error(err);
      const message = err?.result?.error?.message ?? "Error";
      setError(message);
      notify(message, "error");
      (window as any).gtag?.("event", "GoogleCloud_submit_pipeline_job", {
        result: "failed",
      });
    }
  }, [vertexPipelineJob, project, componentSpec]);

  useEffect(() => {
    if (componentSpec !== undefined) {
      try {
        const vertexPipelineJob = buildVertexPipelineJobFromGraphComponent(
          componentSpec,
          project.gcsOutputDirectory,
          pipelineArguments,
        );
        setError(undefined);
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
        setJsonBlobUrl(vertexPipelineJsonBlobUrl);
      } catch (err) {
        const message =
          typeof err === "object" && err instanceof Error
            ? err.toString()
            : String(err);
        setError(message);
        notify(message, "error");
        setVertexPipelineJob(undefined);
        setJsonBlobUrl(undefined);
      }
    }
  }, [componentSpec, pipelineArguments, project.gcsOutputDirectory]);

  return {
    project,
    cloudProjects,
    jsonBlobUrl,
    jobWebUrl,
    error,
    isValid,
    updateProject,
    submit,
    refreshProjectList,
  };
};

const getDetailsFromLocalStorage = () => {
  return {
    projects: JSON.parse(
      window.localStorage?.getItem(LOCAL_STORAGE_PROJECT_IDS_KEY) ?? "[]",
    ),
    id: window.localStorage?.getItem(LOCAL_STORAGE_PROJECT_ID_KEY) ?? "",
    region:
      window.localStorage?.getItem(LOCAL_STORAGE_REGION_KEY) ??
      VERTEX_AI_PIPELINES_DEFAULT_REGION,
    gcsOutputDirectory:
      window.localStorage?.getItem(LOCAL_STORAGE_GCS_OUTPUT_DIRECTORY_KEY) ??
      "",
    googleCloudOAuthClientId:
      "640001104961-2m8hs192tmd9f9nssbr5thr5o3uhmita.apps.googleusercontent.com",
  };
};

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

const ensureGoogleCloudAuthorizesScopes = async (
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
