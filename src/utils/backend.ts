export function getBackendStatusString(
  configured: boolean,
  available: boolean,
): string {
  const backendNotConfigured = "The backend is not configured.";
  const backendUnavailable = "The configured backend is currently unavailable.";
  const backendAvailableString = "The configured backend is available.";
  return configured
    ? available
      ? backendAvailableString
      : backendUnavailable
    : backendNotConfigured;
}
