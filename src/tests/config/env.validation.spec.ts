// --- Test framework ---
import { describe, expect, it } from 'vitest';

// --- Subject under test ---
import { validateEnv } from '@/config/env.validation';

describe('validateEnv', () => {
  it('accepts an empty environment (every variable is optional)', () => {
    expect(() => validateEnv({})).not.toThrow();
  });

  it('accepts a fully-specified, well-formed environment', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        PORT: '8080',
        USERS_API_BASE_URL: 'https://api.example.com',
        USERS_API_TIMEOUT_MS: '3000',
      }),
    ).not.toThrow();
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => validateEnv({ PORT: 'not-a-number' })).toThrow(/PORT/);
  });

  it('rejects a PORT outside the valid range', () => {
    expect(() => validateEnv({ PORT: '99999' })).toThrow(/PORT/);
  });

  it('rejects a malformed base URL', () => {
    expect(() => validateEnv({ USERS_API_BASE_URL: 'not-a-url' })).toThrow(
      /USERS_API_BASE_URL/,
    );
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('rejects a non-integer page size', () => {
    expect(() => validateEnv({ USERS_API_PAGE_SIZE: 'lots' })).toThrow(
      /USERS_API_PAGE_SIZE/,
    );
  });
});