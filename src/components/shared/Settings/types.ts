export interface BetaFlag {
  name: string;
  description: string;
  default: boolean;
}

export interface BetaFlagsStorage {
  betaFlags: Record<string, boolean> | undefined;
}
