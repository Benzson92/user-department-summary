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
  envVariables: Record<string, unknown>,
): Record<string, unknown> => {
  const envConfig = plainToInstance(EnvironmentVariables, envVariables, {
    enableImplicitConversion: true,
  });

  const validationErrors = validateSync(envConfig, { skipMissingProperties: true });

  if (validationErrors.length > 0) {
    const errorDetails = validationErrors
      .map(
        (error) =>
          `  - ${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`,
      )
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${errorDetails}`);
  }

  return envVariables;
};
