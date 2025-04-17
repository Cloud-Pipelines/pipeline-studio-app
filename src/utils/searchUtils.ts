/**
 * Normalizes text for case-insensitive searching
 */
export const normalizeForSearch = (text: string): string => {
  return text.toLowerCase().trim();
};

/**
 * Checks if a search term is contained in text, handling multi-word searches
 * For multi-word searches, all words must be present in the text to match
 */
export const containsSearchTerm = (
  text: string | undefined,
  searchTerm: string,
): boolean => {
  if (!text) return false;

  const normalizedText = normalizeForSearch(text);
  const normalizedSearchTerm = normalizeForSearch(searchTerm);

  // For single word searches, just check for includes
  if (!normalizedSearchTerm.includes(" ")) {
    return normalizedText.includes(normalizedSearchTerm);
  }

  // For multi-word searches, check if all words are present
  const searchWords = normalizedSearchTerm
    .split(" ")
    .filter((word) => word.length > 0);
  return searchWords.every((word) => normalizedText.includes(word));
};
