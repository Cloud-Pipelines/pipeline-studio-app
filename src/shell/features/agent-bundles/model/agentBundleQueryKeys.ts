/**
 * Query keys for React Query, following the SessionQueryKeys factory pattern.
 */
export const AgentBundleQueryKeys = {
  All: () => ["agent-bundles"] as const,
  Id: (id: string) => ["agent-bundles", id] as const,
} as const;
