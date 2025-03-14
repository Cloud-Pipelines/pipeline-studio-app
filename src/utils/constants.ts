export const ABOUT_URL = "https://cloud-pipelines.net/";
export const GIVE_FEEDBACK_URL =
  "https://github.com/Cloud-Pipelines/pipeline-editor/issues";
export const PRIVACY_POLICY_URL = "https://cloud-pipelines.net/privacy_policy";

export const EDITOR_PATH = "/editor";
export const APP_ROUTES = {
  HOME: "/",
  PIPELINE_EDITOR: `${EDITOR_PATH}/$name`,
  RUN_DETAIL: "/runs/$id",
  RUNS: "/runs",
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
