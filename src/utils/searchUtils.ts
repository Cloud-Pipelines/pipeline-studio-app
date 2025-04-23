/**
 * Normalizes text for case-insensitive searching
 */
export const normalizeForSearch = (text: string): string => {
  return text.toLowerCase().trim();
};

/**
 * Checks if a search term is contained in text
 * Simple substring match check
 */
export const containsSearchTerm = (
  text: string | undefined,
  searchTerm: string,
): boolean => {
  if (!text) return false;

  const normalizedText = normalizeForSearch(text);
  const normalizedSearchTerm = normalizeForSearch(searchTerm);

  // Just check if the text includes the search term
  return normalizedText.includes(normalizedSearchTerm);
};
