import type { JWTPayload } from "./types";
import { REQUIRE_AUTHORIZATION } from "@/utils/constants";

export function isAuthorizationRequired() {
  return REQUIRE_AUTHORIZATION === "true";
}

export function readJWT(token: string) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );

  return JSON.parse(jsonPayload);
}

export function convertJWTToJWTPayload(token: string) {
  const payload = readJWT(token) as Omit<JWTPayload, "original_token">;

  return {
    original_token: token,
    ...payload,
  } satisfies JWTPayload;
}
