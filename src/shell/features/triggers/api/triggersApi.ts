import type { Trigger, UpdateTriggerRequest } from "@/shell/contracts";
import { apiUrl } from "@/shell/lib/basePath";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Updates a mutable trigger field (enabled/prompt/title/schedule). */
export async function updateTrigger(
  sessionId: string,
  triggerId: string,
  input: UpdateTriggerRequest,
): Promise<Trigger> {
  const data = await parseJson<{ trigger: Trigger }>(
    await fetch(apiUrl(`/api/sessions/${sessionId}/triggers/${triggerId}`), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return data.trigger;
}

/** Deletes a trigger. */
export async function deleteTrigger(
  sessionId: string,
  triggerId: string,
): Promise<void> {
  const res = await fetch(
    apiUrl(`/api/sessions/${sessionId}/triggers/${triggerId}`),
    {
      method: "DELETE",
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to delete trigger (status ${res.status})`);
  }
}
