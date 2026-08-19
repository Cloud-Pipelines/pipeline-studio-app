import { useQuery } from "@tanstack/react-query";

import { listAgentBundles } from "@/shell/features/agent-bundles/api/agentBundlesApi";
import { AgentBundleQueryKeys } from "@/shell/features/agent-bundles/model/agentBundleQueryKeys";

export function useAgentBundles() {
  return useQuery({
    queryKey: AgentBundleQueryKeys.All(),
    queryFn: listAgentBundles,
  });
}
