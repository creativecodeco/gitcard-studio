import { IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export class GetUserMetricsQueryDto {
  @IsNotEmpty()
  @IsString()
  @Matches(GITHUB_USERNAME_PATTERN, {
    message: 'username must be a valid GitHub username.',
  })
  username!: string;

  @IsOptional()
  @IsIn(['es', 'en'])
  locale?: 'es' | 'en';
}

export class DisconnectAccountDto {
  @IsNotEmpty()
  @IsString()
  @Matches(GITHUB_USERNAME_PATTERN, {
    message: 'username must be a valid GitHub username.',
  })
  username!: string;

  @IsOptional()
  @IsIn(['es', 'en'])
  locale?: 'es' | 'en';
}

export class PurgeSelfAccountDto {
  @IsNotEmpty()
  @IsString()
  @Matches(GITHUB_USERNAME_PATTERN, {
    message: 'username must be a valid GitHub username.',
  })
  username!: string;

  @IsOptional()
  @IsIn(['es', 'en'])
  locale?: 'es' | 'en';
}
