// --- Libraries ---
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Declares the SHAPE and CONSTRAINTS of the environment.
 *
 * Every field is optional because sensible DEFAULTS live in the config
 * factories (the single source of truth for values). This schema's only job is
 * to reject MALFORMED values — a non-numeric PORT, a port out of range, a base
 * URL that isn't a URL — at startup, with a precise message, rather than
 * letting the app boot and then explode at 2am on the first request.
 */
class EnvironmentVariables {
  @IsOptional()
  @IsEnum(NodeEnv)
  NODE_ENV?: NodeEnv;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(65_535)
  PORT?: number;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  USERS_API_BASE_URL?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  USERS_API_TIMEOUT_MS?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  USERS_API_PAGE_SIZE?: number;
}

/**
 * The function handed to `ConfigModule.forRoot({ validate })`. NestJS calls it
 * once at boot with the raw environment. We validate a COPY (with implicit
 * string -> number conversion so the numeric rules can run) and, on any error,
 * throw a readable summary. We return the raw env untouched so the config
 * factories keep reading from `process.env` as their source.
 */
export const validateEnv = (
  raw: Record<string, unknown>,
): Record<string, unknown> => {
  const parsed = plainToInstance(EnvironmentVariables, raw, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(parsed, { skipMissingProperties: true });

  if (errors.length > 0) {
    const details = errors
      .map(
        (error) =>
          `  - ${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`,
      )
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return raw;
};
