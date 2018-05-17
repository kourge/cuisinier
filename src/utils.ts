/**
 * Converts a camel-cased identifier to a snake-cased one.
 */
export function snake(key: string): string {
  const first = key.charAt(0);
  const rest = key.substr(1);
  return (
    first.toLowerCase() + rest.replace(/[A-Z]|\d+/g, m => `_${m.toLowerCase()}`)
  );
}
