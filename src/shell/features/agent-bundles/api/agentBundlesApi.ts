import type {
  AgentBundleMeta,
  ListAgentBundlesResponse,
} from "@/shell/contracts";
import { apiUrl } from "@/shell/lib/basePath";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function listAgentBundles(): Promise<AgentBundleMeta[]> {
  const data = await parseJson<ListAgentBundlesResponse>(
    await fetch(apiUrl("/api/agent-bundles")),
  );
  return data.bundles;
}

/** URL of a bundle's preview icon; only valid when {@link AgentBundleMeta.hasIcon}. */
export function agentBundleIconUrl(id: string): string {
  return apiUrl(`/api/agent-bundles/${id}/icon`);
}
