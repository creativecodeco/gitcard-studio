import 'reflect-metadata';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';

class EnvConfigDto {
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsNotEmpty()
  @IsString()
  GITHUB_TOKEN!: string;

  @IsNotEmpty()
  @IsString()
  DB_HOST!: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  DB_PORT!: number;

  @IsNotEmpty()
  @IsString()
  DB_USERNAME!: string;

  @IsNotEmpty()
  @IsString()
  DB_PASSWORD!: string;

  @IsNotEmpty()
  @IsString()
  DB_DATABASE!: string;

  @IsNotEmpty()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  DB_SYNCHRONIZE!: boolean;

  @IsNotEmpty()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  DB_SSL!: boolean;

  @IsNotEmpty()
  @IsString()
  ENCRYPTION_KEY!: string;

  @IsNotEmpty()
  @IsString()
  METRICS_KEY!: string;

  @IsOptional()
  @IsString()
  GITHUB_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GITHUB_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  GITHUB_CALLBACK_URL?: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;

  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT?: number;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  REDIS_DB?: number;
}

/**
 * Validates all required environment variables at bootstrap time.
 * Throws with a descriptive error message if any required variable is missing or invalid.
 */
export function validateEnvConfig(): void {
  const config = plainToInstance(EnvConfigDto, process.env, {
    enableImplicitConversion: true
  });

  const errors = validateSync(config, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Environment configuration is invalid:\n  - ${messages}`);
  }
}
