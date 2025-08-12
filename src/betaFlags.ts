interface BetaFlag {
  name: string;
  description: string;
  default: boolean;
  [key: string]: unknown;
}

export const ExistingBetaFlags: Record<string, BetaFlag> = {};
