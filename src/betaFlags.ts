import type { BetaFlags } from "@/types/betaFlags";

export const BETA_FLAG_KEYS = {
  highlightNodeOnComponentHover: "highlight-node-on-component-hover",
  remoteComponentLibrarySearch: "remote-component-library-search",
  redirectOnNewPipelineRun: "redirect-on-new-pipeline-run",
  createdByMeDefault: "created-by-me-default",
};

export const ExistingBetaFlags: BetaFlags = {
  [BETA_FLAG_KEYS.highlightNodeOnComponentHover]: {
    name: "Highlight tasks on component hover",
    description:
      "Highlight the tasks on the Pipeline canvas when the component is hovered over in the component library.",
    default: false,
  },

  [BETA_FLAG_KEYS.remoteComponentLibrarySearch]: {
    name: "Published Components Library",
    description: "Enable the Published Components Library feature.",
    default: false,
  },

  [BETA_FLAG_KEYS.redirectOnNewPipelineRun]: {
    name: "Redirect on new pipeline run",
    description: "Automatically open a new tab after starting a new execution.",
    default: false,
  },

  [BETA_FLAG_KEYS.createdByMeDefault]: {
    name: "Default created by me filter",
    description:
      "Automatically select the 'Created by me' filter when viewing the pipeline run list.",
    default: false,
  },
};
