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

export const USER_PIPELINES_LIST_NAME = "user_pipelines";

export const defaultPipelineYamlWithName = (name: string) => `
name: ${name}
metadata:
  annotations:
    sdk: https://cloud-pipelines.net/pipeline-editor/
    editor.flow-direction: left-to-right
implementation:
  graph:
    tasks: {}
    outputValues: {}
`;

export const VALID_NAME_REGEX = /^[a-zA-Z0-9\s]+$/;
export const VALID_NAME_MESSAGE =
  "Name must be unique and contain only alphanumeric characters and spaces";

// IndexedDB constants
export const DB_NAME = "components";
export const PIPELINE_RUNS_STORE_NAME = "pipeline_runs";

export const USER_COMPONENTS_LIST_NAME = "user_components";

export const TOP_NAV_HEIGHT = 56; // px
export const FOOTER_HEIGHT = 30; // px

export enum ComponentSearchFilter {
  NAME = "Name",
  INPUTNAME = "Input Name",
  INPUTTYPE = "Input Type",
  OUTPUTNAME = "Output Name",
  OUTPUTTYPE = "Output Type",
}

export const COMPONENT_SEARCH_FILTERS = Object.values(ComponentSearchFilter);
