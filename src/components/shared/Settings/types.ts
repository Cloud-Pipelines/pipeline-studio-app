export interface BetaFlag {
  name: string;
  description: string;
  enabled: boolean;
  default: boolean;
}

export interface BetaFlagsStorage {
  betaFlags: Record<string, boolean> | undefined;
}
