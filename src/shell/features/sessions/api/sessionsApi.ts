import type {
  Attachment,
  CreateSessionRequest,
  Session,
  UpdateSessionRequest,
  UploadFilesResponse,
} from "@/shell/contracts";
import { apiUrl } from "@/shell/lib/basePath";

export type CreateSessionInput = CreateSessionRequest;

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function listSessions(): Promise<Session[]> {
  const data = await parseJson<{ sessions: Session[] }>(
    await fetch(apiUrl("/api/sessions")),
  );
  return data.sessions;
}

export async function getSession(id: string): Promise<Session> {
  const data = await parseJson<{ session: Session }>(
    await fetch(apiUrl(`/api/sessions/${id}`)),
  );
  return data.session;
}

export async function createSession(
  input: CreateSessionInput,
): Promise<Session> {
  const data = await parseJson<{ session: Session }>(
    await fetch(apiUrl("/api/sessions"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return data.session;
}

export async function updateSession(
  id: string,
  input: UpdateSessionRequest,
): Promise<Session> {
  const data = await parseJson<{ session: Session }>(
    await fetch(apiUrl(`/api/sessions/${id}`), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return data.session;
}

/**
 * Uploads files into a session's workspace, returning their stored metadata
 * (workspace-relative paths) so they can ride along on a chat message. Sent as
 * multipart with one repeated `files` field per file.
 */
export async function uploadFiles(
  sessionId: string,
  files: File[],
): Promise<Attachment[]> {
  const form = new FormData();
  for (const file of files) form.append("files", file);

  const data = await parseJson<UploadFilesResponse>(
    await fetch(apiUrl(`/api/sessions/${sessionId}/files`), {
      method: "POST",
      body: form,
    }),
  );
  return data.files;
}

/**
 * Fetches the raw text of a session artifact by its resolved file API URL.
 * Used to render text-based artifacts (e.g. Markdown documents) inline.
 */
export async function getArtifactText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  return res.text();
}

export async function markSessionViewed(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/sessions/${id}/viewed`), {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to mark session viewed (status ${res.status})`);
  }
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/sessions/${id}`), { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`Failed to delete session (status ${res.status})`);
  }
}
