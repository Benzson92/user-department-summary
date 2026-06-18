import { registerAs } from '@nestjs/config';

const DEFAULT_PAGE_SIZE = 50;
const MB = 1024 * 1024;

export const usersConfig = registerAs('users', () => ({
  apiBaseUrl: process.env.USERS_API_BASE_URL ?? 'https://dummyjson.com',
  pageSize: Number(process.env.USERS_API_PAGE_SIZE ?? DEFAULT_PAGE_SIZE),
  http: {
    timeoutMs: Number(process.env.USERS_API_TIMEOUT_MS ?? 5_000),
    maxRedirects: 2,
    maxContentLength: 10 * MB,
    maxBodyLength: 1 * MB,
  },
}));
