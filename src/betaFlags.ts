import type { BetaFlag } from "@/types/betaFlags";

export const ExistingBetaFlags = {
  ["highlight-node-on-component-hover"]: {
    name: "Highlight tasks on component hover",
    description:
      "Highlight the tasks on the Pipeline canvas when the component is hovered over in the component library.",
    default: false,
  } as BetaFlag,

  ["redirect-on-new-pipeline-run"]: {
    name: "Redirect on new pipeline run",
    description:
      "Automatically redirect from the editor to the pipeline run page after starting a new execution.",
    default: false,
  } as BetaFlag,
};
