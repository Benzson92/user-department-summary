import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appConfig } from '@/config/app.config';

describe('appConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PORT;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('registers under the "app" namespace', () => {
    expect(appConfig.KEY).toBe('CONFIGURATION(app)');
  });

  describe('defaults', () => {
    it('falls back to the full default shape when no env vars are set', () => {
      expect(appConfig()).toEqual({ port: 3000, nodeEnv: 'development' });
    });
  });

  describe('env overrides', () => {
    it('reads PORT and coerces it to a number', () => {
      process.env.PORT = '8080';

      const config = appConfig();

      expect(config.port).toBe(8080);
      expect(typeof config.port).toBe('number');
    });

    it('reads NODE_ENV verbatim', () => {
      process.env.NODE_ENV = 'production';

      expect(appConfig().nodeEnv).toBe('production');
    });
  });

  describe('coercion edge cases', () => {
    it('treats an empty PORT as 0 (?? does not catch empty strings)', () => {
      process.env.PORT = '';

      expect(appConfig().port).toBe(0);
    });

    it('produces NaN for a non-numeric PORT', () => {
      process.env.PORT = 'not-a-port';

      expect(appConfig().port).toBeNaN();
    });
  });
});