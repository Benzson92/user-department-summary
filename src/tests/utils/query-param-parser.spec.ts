// --- Test framework ---
import { describe, expect, it } from 'vitest';

// --- Subjects under test ---
import { toBoolean, toStringArray } from '@/utils/query-param-parser';

describe('toStringArray', () => {
  it('returns undefined for null or undefined', () => {
    expect(toStringArray(undefined)).toBeUndefined();
    expect(toStringArray(null)).toBeUndefined();
  });

  it('splits a comma-separated string, trimming and dropping blanks', () => {
    expect(toStringArray('Engineering, Marketing ,, Sales ')).toEqual([
      'Engineering',
      'Marketing',
      'Sales',
    ]);
  });

  it('passes through an existing array (still trimmed)', () => {
    expect(toStringArray([' Engineering ', 'Sales'])).toEqual([
      'Engineering',
      'Sales',
    ]);
  });

  it('returns undefined when nothing meaningful remains', () => {
    expect(toStringArray('  ,  ')).toBeUndefined();
  });
});

describe('toBoolean', () => {
  it('passes real booleans through unchanged', () => {
    expect(toBoolean(true)).toBe(true);
    expect(toBoolean(false)).toBe(false);
  });

  it('treats ONLY the literal "true" (any case) as true', () => {
    expect(toBoolean('true')).toBe(true);
    expect(toBoolean('TRUE')).toBe(true);
    expect(toBoolean('false')).toBe(false); // the footgun this guards against
    expect(toBoolean('1')).toBe(false);
    expect(toBoolean(undefined)).toBe(false);
  });
});