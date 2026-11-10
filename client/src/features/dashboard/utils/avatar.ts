/**
 * Safely extracts a display initial for avatars.
 * Prioritizes alphabetical characters in the name, then email, with fallback to 'R'.
 */
export function getSafeInitial(name?: string, email?: string): string {
  if (name) {
    const match = name.trim().match(/[\p{L}]/u);
    if (match) return match[0].toUpperCase();
  }
  if (email) {
    const match = email.trim().match(/[\p{L}]/u);
    if (match) return match[0].toUpperCase();
  }
  return 'R';
}
