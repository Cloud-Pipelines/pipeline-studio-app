export const ABOUT_URL = "https://cloud-pipelines.net/";
export const GIVE_FEEDBACK_URL =
  "https://github.com/Cloud-Pipelines/pipeline-editor/issues";
export const PRIVACY_POLICY_URL = "https://cloud-pipelines.net/privacy_policy";
export const API_URL = import.meta.env.VITE_BACKEND_API_URL ?? "";

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
