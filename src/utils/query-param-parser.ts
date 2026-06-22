
/** "A,B" | ["A","B"] | "A" -> ["A","B"] | ["A"]; blanks are dropped. */
export const toStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const values = Array.isArray(value) ? value : String(value).split(',');
  const normalizedValues = values
    .map((part) => String(part).trim())
    .filter((part) => part.length > 0);
    
  return normalizedValues.length > 0 ? normalizedValues : undefined;
};

export const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  return String(value).toLowerCase() === 'true';
};
