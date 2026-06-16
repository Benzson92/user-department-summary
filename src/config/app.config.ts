// --- Framework ---
import { registerAs } from '@nestjs/config';

/**
 * The 'app' configuration namespace — process-level settings the bootstrap
 * needs. Same pattern as `usersConfig`: defaults here, env overrides, typed
 * access for consumers.
 */
export const appConfig = registerAs('app', () => ({
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
}));
