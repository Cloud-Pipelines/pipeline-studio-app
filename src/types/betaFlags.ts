export interface BetaFlag {
  name: string;
  description: string;
  default: boolean;
}

export type BetaFlags = Record<string, BetaFlag>;
