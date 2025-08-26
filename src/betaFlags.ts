import type { BetaFlag } from "@/types/betaFlags";

export const ExistingBetaFlags: Record<string, BetaFlag> = {
  ["redirect-on-new-pipeline-run"]: {
    name: "Redirect on new pipeline run",
    description:
      "Automatically redirect from the editor to the pipeline run page after starting a new execution.",
    default: false,
  },
};
