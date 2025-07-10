export function isAuthorizationRequired() {
  return import.meta.env.VITE_REQUIRE_AUTHORIZATION === "true";
}
