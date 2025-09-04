/**
 * Trim a digest to 8 first characters.
 *
 * @param digest - The digest to trim.
 * @returns The trimmed digest.
 */
export function trimDigest(digest: string) {
  return digest.slice(0, 8);
}
