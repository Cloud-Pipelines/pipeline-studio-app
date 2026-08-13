/**
 * Addresses the tangent-shell backend, which is a *separate* service from the
 * Tangle backend that the rest of this app talks to.
 *
 * Two modes:
 *
 * - Same-origin (default, and what `pnpm start` gives you). Requests go to
 *   `/shell-api/...` and `/shell-socket.io/...`, which the Vite dev server
 *   proxies to the shell backend, rewriting the prefixes back to `/api` and
 *   `/socket.io` on the way out. The distinct prefixes are what keep this off
 *   the Tangle backend's `/api` namespace, which is served from this same origin
 *   whenever `VITE_BACKEND_API_URL` is unset.
 *
 * - Cross-origin. Set `VITE_SHELL_API_URL` to the shell backend's origin
 *   (e.g. `http://localhost:8787`) and requests go straight there, bypassing the
 *   proxy. The shell backend must then allow this origin via CORS, for the REST
 *   calls and for Socket.IO's polling handshake.
 *
 * `BASE_PREFIX` handles being served from a sub-path; at the origin root it is
 * just `/`.
 */

/**
 * The mount-root pathname, always ending in `/` (e.g. `/tangle-ui/` or `/`).
 *
 * This is Vite's configured `base`, *not* `document.baseURI`: this app has no
 * `<base href>` in index.html, so `baseURI` is whatever route the user is
 * currently on and would leak the route into every API path.
 */
const BASE_PREFIX = import.meta.env.BASE_URL;

/** Shell backend origin when addressing it directly; empty means same-origin. */
export const SHELL_API_ORIGIN = (
  import.meta.env.VITE_SHELL_API_URL ?? ""
).replace(/\/$/, "");

/** Path prefix the dev proxy watches for shell REST traffic. */
const SHELL_API_PREFIX = "shell-api";

/** Socket.IO mount path, matching {@link SHELL_API_PREFIX}'s proxy entry. */
export const SHELL_SOCKET_PATH = SHELL_API_ORIGIN
  ? "/socket.io"
  : `${BASE_PREFIX}shell-socket.io`;

/**
 * Rewrites a shell-backend path (`/api/...`) onto whichever addressing mode is
 * active. Paths that are already absolute URLs are returned untouched.
 */
export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;

  const relative = path.replace(/^\//, "");

  if (SHELL_API_ORIGIN) {
    return `${SHELL_API_ORIGIN}/${relative}`;
  }

  const proxied = relative.startsWith("api/")
    ? `${SHELL_API_PREFIX}/${relative.slice("api/".length)}`
    : relative;

  return `${BASE_PREFIX}${proxied}`;
}

/**
 * Like {@link apiUrl} but always absolute, for URLs that get copied out of the
 * app and called by something else (trigger callbacks). In proxied mode that
 * resolves against this origin, so the copied URL routes through the proxy.
 */
export function absoluteApiUrl(path: string): string {
  return new URL(apiUrl(path), window.location.origin).toString();
}
