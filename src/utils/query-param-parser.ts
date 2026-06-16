/**
 * Generic helpers for coercing raw HTTP query-parameter values into the rich
 * types our DTOs want.
 *
 * Query params always arrive as strings (or arrays of strings), so any DTO
 * that accepts an array or a boolean needs this normalisation BEFORE validation
 * runs. These are framework-agnostic and dependency-free, so any module's DTO
 * can reuse them.
 */

/** "A,B" | ["A","B"] | "A" -> ["A","B"] | ["A"]; blanks are dropped. */
export const toStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const parts = Array.isArray(value) ? value : String(value).split(',');
  const cleaned = parts
    .map((part) => String(part).trim())
    .filter((part) => part.length > 0);
  return cleaned.length > 0 ? cleaned : undefined;
};

/**
 * Query booleans are tricky: `Boolean("false")` is `true`, so naive coercion
 * is a real bug. We compare the literal string instead.
 */
export const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  return String(value).toLowerCase() === 'true';
};
