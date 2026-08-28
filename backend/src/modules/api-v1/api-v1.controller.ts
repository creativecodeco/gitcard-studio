import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { GITHUB_USERNAME_REGEX } from '@/domain/entities/Validation';

@Controller('api/v1')
export class ApiV1Controller {
  @Get('user/stats')
  async getUserStatsJson(
    @Query('username') rawUsername: string
  ): Promise<{ username: string; timestamp: string; format: string; message: string }> {
    if (
      !rawUsername ||
      typeof rawUsername !== 'string' ||
      !GITHUB_USERNAME_REGEX.test(rawUsername.trim())
    ) {
      throw new BadRequestException('Usuario de GitHub inválido');
    }

    const username = rawUsername.trim();

    return {
      username,
      timestamp: new Date().toISOString(),
      format: 'json',
      message: `Estadísticas agregadas para @${username} preparadas para consumir en portafolios web`
    };
  }
}
