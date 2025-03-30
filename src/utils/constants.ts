/* Environment Config */
export const ABOUT_URL =
  import.meta.env.VITE_ABOUT_URL || "https://cloud-pipelines.net/";

export const GIVE_FEEDBACK_URL =
  import.meta.env.VITE_GIVE_FEEDBACK_URL ||
  "https://github.com/Cloud-Pipelines/pipeline-studio-app/issues";

export const PRIVACY_POLICY_URL =
  import.meta.env.VITE_PRIVACY_POLICY_URL ||
  "https://cloud-pipelines.net/privacy_policy";

export const API_URL = import.meta.env.VITE_BACKEND_API_URL || "";

export const GIT_REPO_URL =
  import.meta.env.VITE_GIT_REPO_URL ||
  "https://github.com/Cloud-Pipelines/pipeline-studio-app";

export const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT || "master";

/* App Config */
export const EDITOR_PATH = "/editor";
export const RUNS_BASE_PATH = "/runs";
export const APP_ROUTES = {
  HOME: "/",
  PIPELINE_EDITOR: `${EDITOR_PATH}/$name`,
  RUN_DETAIL: `${RUNS_BASE_PATH}/$id`,
  RUNS: RUNS_BASE_PATH,
};

export const USER_PIPELINES_LIST_NAME = "user_pipelines";

export const defaultPipelineYamlWithName = (name: string) => `
name: ${name}
metadata:
  annotations:
    sdk: https://cloud-pipelines.net/pipeline-editor/
implementation:
  graph:
    tasks: {}
    outputValues: {}
`;
