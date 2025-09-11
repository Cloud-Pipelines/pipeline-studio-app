export const fetchWithErrorHandling = async (
  url: string,
  options?: RequestInit,
): Promise<any> => {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch (fetchError) {
    const message =
      fetchError instanceof Error ? fetchError.message : String(fetchError);
    throw new Error(`Network error: ${message} (URL: ${url})`);
  }

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      // Ignore if we can't read the error body
    }

    throw new Error(
      `HTTP ${response.status} ${response.statusText}: ${errorBody || "No error details"} (URL: ${url})`,
    );
  }

  try {
    return await response.json();
  } catch (parseError) {
    const message =
      parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(`Invalid JSON response: ${message} (URL: ${url})`);
  }
};
