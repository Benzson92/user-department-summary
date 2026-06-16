// --- Framework ---
import { registerAs } from '@nestjs/config';

/** Readable byte unit. */
const MB = 1024 * 1024;

/**
 * The 'users' configuration namespace — the SINGLE source of truth for the
 * upstream user-directory client.
 *
 * DEFAULTS live here; environment variables override them. Consumers inject a
 * fully-typed object (`ConfigType<typeof usersConfig>`), so the call site has
 * NO magic strings, NO inline casts, and NO scattered defaults — just
 * `config.apiBaseUrl`.
 */
export const usersConfig = registerAs('users', () => ({
  apiBaseUrl: process.env.USERS_API_BASE_URL ?? 'https://dummyjson.com',

  // HTTP client hardening — security/resilience knobs, grouped together.
  http: {
    timeoutMs: Number(process.env.USERS_API_TIMEOUT_MS ?? 5_000),
    maxRedirects: 2,
    maxContentLength: 10 * MB,
    maxBodyLength: 1 * MB,
  },
}));
