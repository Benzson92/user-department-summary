import { registerAs } from '@nestjs/config';

const MB = 1024 * 1024;

export const usersConfig = registerAs('users', () => ({
  apiBaseUrl: process.env.USERS_API_BASE_URL ?? 'https://dummyjson.com',

  http: {
    timeoutMs: Number(process.env.USERS_API_TIMEOUT_MS ?? 5_000),
    maxRedirects: 2,
    maxContentLength: 10 * MB,
    maxBodyLength: 1 * MB,
  },
}));
