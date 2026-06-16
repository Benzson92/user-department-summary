// --- Framework ---
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// --- Unit under test ---
import { usersConfig } from '@/config/users.config';

/**
 * `usersConfig` is a `registerAs` factory: a pure function over `process.env`
 * that reads the environment at CALL time (inside the arrow body), not at
 * import time. So each test can swap "ingredients" in `process.env`, call the
 * factory, then put the pantry back exactly as it found it.
 */
describe('usersConfig', () => {
  // The only two env knobs this factory actually tastes.
  const ENV_KEYS = ['USERS_API_BASE_URL', 'USERS_API_TIMEOUT_MS'] as const;

  const pantry: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Clear the counter: stash whatever was there, then remove it so every
    // test starts from a known-empty environment.
    for (const key of ENV_KEYS) {
      pantry[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    // Restore each ingredient to its original spot (or remove it if it never
    // existed) so tests never leak state into one another.
    for (const key of ENV_KEYS) {
      const original = pantry[key];
      if (original === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original;
      }
    }
  });

  describe('defaults (no env set)', () => {
    it('returns the full default recipe', () => {
      expect(usersConfig()).toEqual({
        apiBaseUrl: 'https://dummyjson.com',
        http: {
          timeoutMs: 5_000,
          maxRedirects: 2,
          maxContentLength: 10 * 1024 * 1024, // 10 MB
          maxBodyLength: 1 * 1024 * 1024, //  1 MB
        },
      });
    });
  });

  describe('environment overrides', () => {
    it('overrides apiBaseUrl from USERS_API_BASE_URL', () => {
      process.env.USERS_API_BASE_URL = 'https://users.internal.test';

      expect(usersConfig().apiBaseUrl).toBe('https://users.internal.test');
    });

    it('overrides http.timeoutMs and coerces it to a number', () => {
      process.env.USERS_API_TIMEOUT_MS = '12000';

      const { timeoutMs } = usersConfig().http;

      expect(timeoutMs).toBe(12_000);
      expect(typeof timeoutMs).toBe('number'); // not the raw '12000' string
    });

    it('re-reads process.env on every call (factory is not memoized)', () => {
      process.env.USERS_API_BASE_URL = 'https://first.test';
      expect(usersConfig().apiBaseUrl).toBe('https://first.test');

      process.env.USERS_API_BASE_URL = 'https://second.test';
      expect(usersConfig().apiBaseUrl).toBe('https://second.test');
    });

    it('keeps the hardening knobs constant regardless of env', () => {
      process.env.USERS_API_BASE_URL = 'https://users.internal.test';
      process.env.USERS_API_TIMEOUT_MS = '99999';

      const { maxRedirects, maxContentLength, maxBodyLength } = usersConfig().http;

      expect(maxRedirects).toBe(2);
      expect(maxContentLength).toBe(10 * 1024 * 1024);
      expect(maxBodyLength).toBe(1 * 1024 * 1024);
    });
  });

  describe('timeoutMs numeric coercion — the `??` footgun', () => {
    // `??` only catches null/undefined. An empty string is NOT nullish, so it
    // slips past the default and `Number('')` quietly becomes 0 — a zero-ms
    // timeout. Pinned on purpose: switch `??` -> `||` (or validate) if you want
    // blank values to fall back to 5_000.
    it('does NOT fall back to the default for an empty string (yields 0)', () => {
      process.env.USERS_API_TIMEOUT_MS = '';

      expect(usersConfig().http.timeoutMs).toBe(0);
    });

    it('produces NaN for a non-numeric value (no validation today)', () => {
      process.env.USERS_API_TIMEOUT_MS = 'soon';

      expect(Number.isNaN(usersConfig().http.timeoutMs)).toBe(true);
    });

    it('keeps the default when the var is truly unset', () => {
      // (beforeEach already deleted it.)
      expect(usersConfig().http.timeoutMs).toBe(5_000);
    });
  });

  describe('namespace wiring', () => {
    it('registers under the `users` token', () => {
      expect(usersConfig.KEY).toBe('CONFIGURATION(users)');
    });
  });
});