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
