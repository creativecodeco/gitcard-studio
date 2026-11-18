import {
  Controller,
  Get,
  Header,
  Headers,
  Inject,
  NotFoundException,
  Param,
  Query
} from '@nestjs/common';
import { escapeXml } from '@/utils/escape';
import { GITHUB_USERNAME_REGEX } from '@/domain/entities/Validation';
import { HtmlFileService } from './html-file.service';

const THEME_REGEX = /^[a-z\d_]{1,50}$/i;
const VALID_HOST_REGEX =
  /^(?:localhost|127\.0\.0\.1|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?::\d{1,5})?$/;
const SLUG_CLEAN_REGEX = /[^a-z0-9-]/gi;
const DEFAULT_BASE_URL = 'https://gitcard-studio.creativecode.com.co';

@Controller()
export class RootController {
  constructor(@Inject(HtmlFileService) private readonly htmlFileService: HtmlFileService) {}

  private resolveSafeBaseUrl(hostHeader?: string, forwardedProto?: string): string {
    const configuredPublicUrl = process.env.PUBLIC_URL?.trim().replace(/\/+$/, '');
    if (configuredPublicUrl && /^https?:\/\//i.test(configuredPublicUrl)) {
      return configuredPublicUrl;
    }

    const rawHost = typeof hostHeader === 'string' ? hostHeader.trim() : '';
    if (!rawHost || !VALID_HOST_REGEX.test(rawHost)) {
      return DEFAULT_BASE_URL;
    }

    const isLocalHost = rawHost.startsWith('localhost') || rawHost.startsWith('127.0.0.1');
    if (process.env.NODE_ENV === 'production' && !isLocalHost) {
      const allowedHost = new URL(DEFAULT_BASE_URL).host;
      if (rawHost.toLowerCase() !== allowedHost.toLowerCase()) {
        return DEFAULT_BASE_URL;
      }
    }

    const protocol = forwardedProto === 'https' || !isLocalHost ? 'https' : 'http';
    return `${protocol}://${rawHost}`;
  }

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  @Header('X-Frame-Options', 'DENY')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Referrer-Policy', 'strict-origin-when-cross-origin')
  @Header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  @Header('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'")
  getRoot(
    @Query('user') userQueryParam?: string,
    @Query('username') usernameQueryParam?: string,
    @Query('theme') themeQueryParam?: string,
    @Headers('host') hostHeader?: string,
    @Headers('x-forwarded-proto') forwardedProto?: string
  ): string {
    const userQuery = this.resolveUsernameQuery(userQueryParam, usernameQueryParam);
    const themeQuery = typeof themeQueryParam === 'string' ? themeQueryParam : '';

    const html = this.htmlFileService.getPublicFileOrThrow(
      'index.html',
      'index.html not found. Please build the frontend first.'
    );

    const targetUsername = userQuery && GITHUB_USERNAME_REGEX.test(userQuery) ? userQuery : '';
    const targetTheme = themeQuery && THEME_REGEX.test(themeQuery) ? themeQuery : 'radical';

    if (!targetUsername) {
      return html;
    }

    const baseUrl = this.resolveSafeBaseUrl(hostHeader, forwardedProto);

    return this.injectSocialMetaTags(html, targetUsername, targetTheme, baseUrl);
  }

  @Get('health')
  getHealth(): { status: string; version: string; uptime: number; environment: string } {
    return {
      status: 'ok',
      version: process.env.npm_package_version ?? '1.23.0',
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV ?? 'development'
    };
  }

  @Get('admin/metrics')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  @Header('X-Frame-Options', 'DENY')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Referrer-Policy', 'strict-origin-when-cross-origin')
  @Header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  @Header('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'")
  getAdminMetrics(): string {
    return this.htmlFileService.getPublicFileOrThrow('admin/metrics.html');
  }

  @Get('help')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  @Header('X-Frame-Options', 'DENY')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Referrer-Policy', 'strict-origin-when-cross-origin')
  @Header('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'")
  getHelp(): string {
    return this.htmlFileService.getPublicFileOrThrow('help.html');
  }

  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  @Header('X-Frame-Options', 'DENY')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Referrer-Policy', 'strict-origin-when-cross-origin')
  @Header('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'")
  getPrivacy(): string {
    return this.htmlFileService.getPublicFileOrThrow('privacy.html');
  }

  @Get('terms')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  @Header('X-Frame-Options', 'DENY')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Referrer-Policy', 'strict-origin-when-cross-origin')
  @Header('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'")
  getTerms(): string {
    return this.htmlFileService.getPublicFileOrThrow('terms.html');
  }

  @Get('help/:slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  @Header('X-Frame-Options', 'DENY')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Referrer-Policy', 'strict-origin-when-cross-origin')
  @Header('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'")
  getHelpSubPage(@Param('slug') slug: string): string {
    const safeSlug = slug.replace(SLUG_CLEAN_REGEX, '');
    if (!safeSlug) {
      throw new NotFoundException('Page not found.');
    }
    return this.htmlFileService.getPublicFileOrThrow(`help/${safeSlug}.html`);
  }

  private resolveUsernameQuery(userQueryParam?: string, usernameQueryParam?: string): string {
    if (typeof userQueryParam === 'string') return userQueryParam;
    if (typeof usernameQueryParam === 'string') return usernameQueryParam;
    return '';
  }

  private injectSocialMetaTags(
    html: string,
    targetUsername: string,
    targetTheme: string,
    baseUrl: string
  ): string {
    const encodedUser = encodeURIComponent(targetUsername);
    const encodedTheme = encodeURIComponent(targetTheme);

    const safeImageUrl = escapeXml(
      `${baseUrl}/api/stats?username=${encodedUser}&theme=${encodedTheme}`
    );
    const safeTitle = escapeXml(
      `Tarjetas de estadísticas para @${targetUsername} | GitCard Studio`
    );
    const safeDescription = escapeXml(
      `Mira las estadísticas, lenguajes más usados y trofeos de GitHub para @${targetUsername} generados dinámicamente.`
    );

    return html
      .replace(
        /<meta property="og:image" content="[^"]*"\/?>/gi,
        () => `<meta property="og:image" content="${safeImageUrl}" />`
      )
      .replace(
        /<meta property="twitter:image" content="[^"]*"\/?>/gi,
        () => `<meta property="twitter:image" content="${safeImageUrl}" />`
      )
      .replace(
        /<meta property="og:title" content="[^"]*"\/?>/gi,
        () => `<meta property="og:title" content="${safeTitle}" />`
      )
      .replace(
        /<meta property="twitter:title" content="[^"]*"\/?>/gi,
        () => `<meta property="twitter:title" content="${safeTitle}" />`
      )
      .replace(
        /<meta property="og:description" content="[^"]*"\/?>/gi,
        () => `<meta property="og:description" content="${safeDescription}" />`
      )
      .replace(
        /<meta property="twitter:description" content="[^"]*"\/?>/gi,
        () => `<meta property="twitter:description" content="${safeDescription}" />`
      )
      .replace(
        /<meta name="description" content="[^"]*"\/?>/gi,
        () => `<meta name="description" content="${safeDescription}" />`
      )
      .replace(/<title>[^<]*<\/title>/gi, () => `<title>${safeTitle}</title>`);
  }
}
