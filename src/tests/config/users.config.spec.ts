import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { usersConfig } from '@/config/users.config';

describe('usersConfig', () => {
  const ENV_KEYS = ['USERS_API_BASE_URL', 'USERS_API_TIMEOUT_MS', 'USERS_API_PAGE_SIZE'] as const;

  const pantry: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      pantry[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const original = pantry[key];
      if (original === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original;
      }
    }
  });

  describe('when environment variables are not configured', () => {
    it('returns the default users API configuration', () => {
      expect(usersConfig()).toEqual({
        apiBaseUrl: 'https://dummyjson.com',
        pageSize: 50,
        http: {
          timeoutMs: 5_000,
          maxRedirects: 2,
          maxContentLength: 10 * 1024 * 1024, // 10 MB
          maxBodyLength: 1 * 1024 * 1024, //  1 MB
        },
      });
    });
  });

  describe('when environment variables are configured', () => {
    it('uses the configured API base URL', () => {
      process.env.USERS_API_BASE_URL = 'https://users.internal.test';

      expect(usersConfig().apiBaseUrl).toBe('https://users.internal.test');
    });

    it('converts the configured timeout value to a number', () => {
      process.env.USERS_API_TIMEOUT_MS = '12000';

      const { timeoutMs } = usersConfig().http;

      expect(timeoutMs).toBe(12_000);
      expect(typeof timeoutMs).toBe('number'); // not the raw '12000' string
    });

    it('returns updated values when environment variables change between calls', () => {
      process.env.USERS_API_BASE_URL = 'https://first.test';
      expect(usersConfig().apiBaseUrl).toBe('https://first.test');

      process.env.USERS_API_BASE_URL = 'https://second.test';
      expect(usersConfig().apiBaseUrl).toBe('https://second.test');
    });

    it('preserves fixed HTTP safety limits regardless of environment overrides', () => {
      process.env.USERS_API_BASE_URL = 'https://users.internal.test';
      process.env.USERS_API_TIMEOUT_MS = '99999';

      const { maxRedirects, maxContentLength, maxBodyLength } = usersConfig().http;

      expect(maxRedirects).toBe(2);
      expect(maxContentLength).toBe(10 * 1024 * 1024);
      expect(maxBodyLength).toBe(1 * 1024 * 1024);
    });
  });

  describe('timeout value handling', () => {
    it('returns 0 when the timeout environment variable is an empty string', () => {
      process.env.USERS_API_TIMEOUT_MS = '';

      expect(usersConfig().http.timeoutMs).toBe(0);
    });

    it('returns NaN when the timeout environment variable is not numeric', () => {
      process.env.USERS_API_TIMEOUT_MS = 'soon';

      expect(Number.isNaN(usersConfig().http.timeoutMs)).toBe(true);
    });

    it('uses the default timeout when the environment variable is not defined', () => {
      expect(usersConfig().http.timeoutMs).toBe(5_000);
    });
  });

  describe('configuration registration', () => {
    it('registers the configuration under the users namespace', () => {
      expect(usersConfig.KEY).toBe('CONFIGURATION(users)');
    });
  });
});