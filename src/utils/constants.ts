export const ABOUT_URL = "https://cloud-pipelines.net/";
export const GIVE_FEEDBACK_URL =
  "https://github.com/Cloud-Pipelines/pipeline-editor/issues";
export const PRIVACY_POLICY_URL = "https://cloud-pipelines.net/privacy_policy";

const basePath = import.meta.env.VITE_BASE_PATH;
export const EDITOR_PATH = `${basePath}/editor`;
export const APP_ROUTES = {
  HOME: `${basePath}`,
  PIPELINE_EDITOR: `${EDITOR_PATH}/$name`,
  RUN_DETAIL: `${basePath}/runs/$id`,
  RUNS: `${basePath}/runs`,
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
