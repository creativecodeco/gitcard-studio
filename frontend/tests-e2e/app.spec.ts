import { test, expect, type Page } from '@playwright/test';

const MOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195"><rect width="100%" height="100%" fill="#0d1117"/><text x="20" y="30" fill="#fff">Mock Card</text></svg>`;

/**
 * Attaches strict listeners to fail if any uncaught exception, console.error,
 * or unexpected 5xx server response occurs during UI interactions.
 */
function attachZeroErrorLogGuards(
  page: Page,
  options: { allow401?: boolean; allow404?: boolean } = {}
): { consoleErrors: string[]; pageErrors: string[]; server5xxErrors: string[] } {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const server5xxErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (
        options.allow401 &&
        (text.includes('401') || text.includes('Unauthorized') || text.includes('Failed to load'))
      ) {
        return;
      }
      if (options.allow404 && text.includes('404')) {
        return;
      }
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  page.on('response', (res) => {
    if (res.status() >= 500) {
      server5xxErrors.push(`${res.status()} ${res.request().method()} ${res.url()}`);
    }
  });

  return { consoleErrors, pageErrors, server5xxErrors };
}

async function setupStandardApiMocks(page: Page): Promise<void> {
  await page.route('**/api/config*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ privateStatsComingSoon: false })
    });
  });

  await page.route('**/api/metrics/users/count*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(128)
    });
  });

  await page.route('**/api/users/repos*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        username: 'creativecode',
        repos: [
          {
            name: 'gitcard-studio',
            owner: 'creativecode',
            fullName: 'creativecode/gitcard-studio',
            stars: 42
          },
          { name: 'ui-kit', owner: 'creativecodeco', fullName: 'creativecodeco/ui-kit', stars: 19 }
        ]
      })
    });
  });

  const cardEndpoints = [
    'stats',
    'languages',
    'repo',
    'repo-views',
    'rank',
    'streak',
    'trophies',
    'top-repos',
    'sponsors',
    'commit-activity',
    'today-status',
    'timeline-matrix',
    'views',
    'tech-stack',
    'badge'
  ];

  for (const endpoint of cardEndpoints) {
    await page.route(`**/api/${endpoint}*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml; charset=utf-8',
        body: MOCK_SVG
      });
    });
  }
}

test.describe('GitCard Studio Complete E2E User & Log Integrity Suite', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await setupStandardApiMocks(page);
  });

  test('1. Initial load, Privacy Consent Banner & Theme Toggle store encrypted state with 0 errors', async ({
    page
  }) => {
    const logs = attachZeroErrorLogGuards(page);
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('GitCard Studio');
    await expect(page.locator('h2.section-title').first()).toContainText('Configuración');
    await expect(page.locator('#username-input')).toBeVisible();
    await expect(page.locator('#btn-generate')).toBeVisible();

    // Privacy banner should be visible initially and store encrypted value when accepted
    const privacyBanner = page.locator('#privacy-consent-banner');
    await expect(privacyBanner).toBeVisible();
    await page.click('#btn-accept-privacy');
    await expect(privacyBanner).toHaveClass(/hidden/);

    const rawPrivacy = await page.evaluate(() => localStorage.getItem('gitcard_privacy_accepted'));
    expect(rawPrivacy).toBeTruthy();
    expect(rawPrivacy?.startsWith('gcs_enc_v1.')).toBe(true);

    // Toggle light/dark theme and verify encrypted storage
    const themeToggle = page.locator('#btn-theme-toggle');
    await themeToggle.click();
    await expect(page.locator('body')).toHaveClass(/light-mode/);

    const rawTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(rawTheme?.startsWith('gcs_enc_v1.')).toBe(true);
    expect(rawTheme).not.toContain('light');

    await themeToggle.click();
    await expect(page.locator('body')).not.toHaveClass(/light-mode/);

    expect(logs.consoleErrors).toEqual([]);
    expect(logs.pageErrors).toEqual([]);
    expect(logs.server5xxErrors).toEqual([]);
  });

  test('2. Generate all 14 cards, filter by category tabs, and customize repository without errors', async ({
    page
  }) => {
    const logs = attachZeroErrorLogGuards(page);
    await page.goto('/');

    await page.fill('#username-input', 'creativecode');
    await page.click('#btn-generate');

    // Global loading overlay must hide cleanly once cards load
    await expect(page.locator('#global-loading')).toHaveClass(/hidden/);

    // Verify primary card images are visible and have valid URLs
    const statsImg = page.locator('#stats-img');
    await expect(statsImg).toBeVisible();
    expect(await statsImg.getAttribute('src')).toContain('/api/stats?username=creativecode');

    const repoViewsImg = page.locator('#repo-views-img');
    await expect(repoViewsImg).toBeVisible();
    expect(await repoViewsImg.getAttribute('src')).toContain(
      '/api/repo-views?username=creativecode'
    );

    // Test category filter tabs (Estadísticas, Actividad, Repositorios, Badges, Todas)
    const categories = ['stats', 'activity', 'repos', 'badges', 'all'];
    for (const cat of categories) {
      const tab = page.locator(`.filter-tab[data-filter="${cat}"]`);
      await tab.click();
      await expect(tab).toHaveClass(/active/);
    }

    // Filter by specific repo
    await page.fill('#repo-input', 'creativecodeco/ui-kit');
    await page.click('#btn-generate');
    await expect(page.locator('#markdown-repo-code')).toContainText('repo=creativecodeco%2Fui-kit');
    await expect(page.locator('#markdown-repo-views-code')).toContainText(
      'repo=creativecodeco%2Fui-kit'
    );

    expect(logs.consoleErrors).toEqual([]);
    expect(logs.pageErrors).toEqual([]);
    expect(logs.server5xxErrors).toEqual([]);
  });

  test('3. Rapid changes across themes, custom color pickers, widths, formats (SVG/PNG), and link styles produce 0 errors', async ({
    page
  }) => {
    const logs = attachZeroErrorLogGuards(page);
    await page.goto('/');

    await page.fill('#username-input', 'creativecode');
    await page.click('#btn-generate');

    // Select main themes
    await page.click('#theme-neon');
    await expect(page.locator('#markdown-stats-code')).toContainText('theme=neon');

    // Expand extra themes accordion and select radical & synthwave
    const toggleThemesBtn = page.locator('#btn-toggle-themes');
    await toggleThemesBtn.click();
    await page.click('#theme-radical');
    await expect(page.locator('#markdown-stats-code')).toContainText('theme=radical');
    await expect(page.locator('#theme-radical')).toHaveClass(/active/);

    await page.click('#theme-synthwave');
    expect(page.url()).toContain('theme=synthwave');

    // Select Custom theme and adjust color pickers
    await page.click('#theme-custom');
    const customPickerPanel = page.locator('#custom-theme-picker-panel');
    await expect(customPickerPanel).not.toHaveClass(/hidden/);
    await page.fill('#picker-bg', '#112233');
    await page.locator('#picker-bg').dispatchEvent('change');
    await expect(page.locator('#markdown-stats-code')).toContainText('bg_color=112233');

    // Test Card Width controls (100%, custom px, default)
    await page.click('#width-full');
    await expect(page.locator('#markdown-stats-code')).toContainText('card_width=100%25');

    await page.fill('#custom-width-input', '600');
    await page.click('#btn-apply-width');
    await expect(page.locator('#markdown-stats-code')).toContainText('card_width=600');

    await page.click('#width-default');

    // Test Format selector (PNG vs SVG)
    await page.selectOption('#format-select', 'png');
    await expect(page.locator('#markdown-stats-code')).toContainText('format=png');
    await page.selectOption('#format-select', 'svg');

    // Test Link Style selector (Linked vs Raw)
    await page.selectOption('#link-style-select', 'raw');
    const rawMarkdown = await page.locator('#markdown-stats-code').textContent();
    expect(rawMarkdown?.trim().startsWith('![')).toBe(true);

    await page.selectOption('#link-style-select', 'linked');
    const linkedMarkdown = await page.locator('#markdown-stats-code').textContent();
    expect(linkedMarkdown?.trim().startsWith('[![')).toBe(true);

    expect(logs.consoleErrors).toEqual([]);
    expect(logs.pageErrors).toEqual([]);
    expect(logs.server5xxErrors).toEqual([]);
  });

  test('4. Multilingual i18n switching across all 7 languages (es, en, fr, de, pt, ja, zh) without errors', async ({
    page
  }) => {
    const logs = attachZeroErrorLogGuards(page);
    await page.goto('/');

    await page.fill('#username-input', 'creativecode');
    await page.click('#btn-generate');

    const locales: Array<{ code: string; expectedTitle: string }> = [
      { code: 'en', expectedTitle: 'Configuration' },
      { code: 'fr', expectedTitle: 'Configuration' },
      { code: 'de', expectedTitle: 'Konfiguration' },
      { code: 'pt', expectedTitle: 'Configuração' },
      { code: 'ja', expectedTitle: '設定' },
      { code: 'zh', expectedTitle: '配置' },
      { code: 'es', expectedTitle: 'Configuración' }
    ];

    for (const loc of locales) {
      await page.selectOption('#locale-select', loc.code);
      await expect(page.locator('h2.section-title').first()).toContainText(loc.expectedTitle);
      if (loc.code !== 'es') {
        expect(page.url()).toContain(`locale=${loc.code}`);
        await expect(page.locator('#markdown-stats-code')).toContainText(`&locale=${loc.code}`);
      }
    }

    expect(logs.consoleErrors).toEqual([]);
    expect(logs.pageErrors).toEqual([]);
    expect(logs.server5xxErrors).toEqual([]);
  });

  test('5. Sample README generator layouts (Vertical & Grid), Live HTML Preview, and Clipboard Copy Toast', async ({
    page
  }) => {
    const logs = attachZeroErrorLogGuards(page);
    await page.goto('/');

    await page.fill('#username-input', 'creativecode');
    await page.click('#btn-generate');

    const readmeTextarea = page.locator('#sample-readme-textarea');
    await expect(readmeTextarea).toHaveValue(/creativecode/);

    // Switch to 2-column grid layout
    await page.click('#btn-readme-layout-grid');
    await expect(readmeTextarea).toHaveValue(/<table border="0">/);

    // Switch to Live Preview tab
    await page.click('#tab-readme-preview');
    const renderedReadme = page.locator('#sample-readme-rendered');
    await expect(renderedReadme).not.toHaveClass(/hidden/);
    await expect(renderedReadme.locator('table')).toBeVisible();

    // Switch back to Code tab & Vertical layout
    await page.click('#tab-readme-code');
    await page.click('#btn-readme-layout-vertical');

    // Copy card markdown and verify toast notification
    await page.click('#btn-copy-stats');
    const toast = page
      .locator('.toast.success')
      .filter({ hasText: 'Código copiado al portapapeles con éxito' });
    await expect(toast).toBeVisible();

    expect(logs.consoleErrors).toEqual([]);
    expect(logs.pageErrors).toEqual([]);
    expect(logs.server5xxErrors).toEqual([]);
  });

  test('6. OAuth / Connected Account flow, Tamper Guard on localStorage, GDPR Purge Modal & Account Disconnect', async ({
    page
  }) => {
    const logs = attachZeroErrorLogGuards(page);

    await page.route('**/api/users/me/metrics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'creativecode',
          connected: true,
          tokenType: 'app_user',
          accessible_repos: [
            {
              name: 'gitcard-studio',
              owner: 'creativecode',
              fullName: 'creativecode/gitcard-studio',
              stars: 50
            }
          ],
          metrics: {
            profile_views: 320,
            repo_views: 85,
            repos_views_breakdown: [{ repo: 'gitcard-studio', views: 85 }],
            stats_renders: 120,
            languages_renders: 80
          }
        })
      });
    });

    await page.route('**/api/auth/disconnect*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Cuenta desconectada' })
      });
    });

    // Simulate OAuth callback redirect with session token
    await page.goto(
      '/?auth_success=1&username=creativecode&session_token=gcss_v2.00112233445566778899aabb.cipher.00112233445566778899aabbccddeeff'
    );

    // URL parameters must be scrubbed automatically via history.replaceState
    expect(page.url()).not.toContain('session_token=');
    expect(page.url()).not.toContain('auth_success=');

    // Verify stored values in localStorage & sessionStorage are encrypted (never plain-text)
    const storedState = await page.evaluate(() => ({
      activeUser: localStorage.getItem('gh_active_user'),
      regUser: localStorage.getItem('registered-github-username'),
      sessionTok: sessionStorage.getItem('gh_session_token')
    }));
    expect(storedState.activeUser?.startsWith('gcs_enc_v1.')).toBe(true);
    expect(storedState.activeUser).not.toContain('creativecode');
    expect(storedState.regUser?.startsWith('gcs_enc_v1.')).toBe(true);
    expect(storedState.sessionTok?.startsWith('gcs_enc_v1.')).toBe(true);

    // Connected account view should be visible with metrics and repo breakdown
    await expect(page.locator('#token-registered')).toBeVisible();
    await expect(page.locator('#connected-username-display')).toHaveText('@creativecode');
    await expect(page.locator('#metric-profile-views')).toHaveText('320');
    await expect(page.locator('#metric-repo-views')).toHaveText('85');
    await expect(page.locator('#metric-repo-breakdown')).toContainText('gitcard-studio');

    // Open and close GDPR Purge Modal, testing typing validation
    const purgeBtn = page.locator('#btn-open-purge-modal');
    await expect(purgeBtn).toBeVisible();
    await purgeBtn.click();

    const purgeModal = page.locator('#purge-modal');
    await expect(purgeModal).toBeVisible();
    await expect(page.locator('#btn-confirm-purge')).toBeDisabled();

    await page.fill('#purge-username', 'creativecode');
    await expect(page.locator('#btn-confirm-purge')).toBeEnabled();

    await page.click('#btn-close-purge');
    await expect(purgeModal).toHaveClass(/hidden/);

    // Verify tamper guard purges manual DevTools edits in localStorage
    await page.evaluate(() => {
      localStorage.setItem('theme', 'manually_tampered_plaintext');
      window.dispatchEvent(new Event('focus'));
    });
    const tamperedThemeAfterGuard = await page.evaluate(() => localStorage.getItem('theme'));
    expect(tamperedThemeAfterGuard).toBeNull();

    // Disconnect account
    await page.click('#btn-disconnect-account');
    await expect(page.locator('#token-unregistered')).toBeVisible();

    expect(logs.consoleErrors).toEqual([]);
    expect(logs.pageErrors).toEqual([]);
    expect(logs.server5xxErrors).toEqual([]);
  });

  test('7. Admin Metrics Dashboard E2E: header-based auth, encrypted sessionStorage, KPIs, pagination, and batch audit', async ({
    page
  }) => {
    const logs = attachZeroErrorLogGuards(page, { allow401: true });
    const validKey = 'correctmetricskey';

    const mockGlobalMetrics = {
      totalRenders: 1250,
      statsRenders: 400,
      languagesRenders: 300,
      repoRenders: 150,
      rankRenders: 100,
      streakRenders: 100,
      trophiesRenders: 100,
      viewsRenders: 100,
      repoViewsRenders: 45
    };

    const mockUserMetrics = Array.from({ length: 15 }, (_, i) => ({
      username: i === 0 ? 'octocat' : `user_${i + 1}`,
      stats_web: 50,
      stats_github: 20,
      languages_web: 30,
      languages_github: 10,
      profile_views: 150 + i,
      repo_views: 12,
      readme_verified: i === 0,
      detected_cards: 'stats, views',
      last_updated: '2026-07-21T10:00:00.000Z'
    }));

    await page.route(/\/api\/metrics/, async (route) => {
      const url = new URL(route.request().url());
      const headerKey = route.request().headers()['x-api-key'];

      // Ensure key is NEVER leaked in URL query params
      expect(url.searchParams.get('key')).toBeNull();

      if (headerKey !== validKey) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Acceso no autorizado' })
        });
        return;
      }

      if (url.pathname.includes('/api/metrics/users')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUserMetrics)
        });
      } else if (url.pathname.includes('/api/metrics/history')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { date: '2026-07-20', count: 150 },
            { date: '2026-07-21', count: 160 }
          ])
        });
      } else if (url.pathname.includes('/api/metrics/breakdown')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            formats: [{ format: 'svg', count: 1200 }],
            locales: [{ locale: 'es', count: 900 }],
            themes: [{ theme: 'dark', count: 600 }]
          })
        });
      } else if (url.pathname.includes('/api/metrics/verify-readmes-batch')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalAudited: 15,
            verifiedCount: 5,
            results: [{ username: 'octocat', isUsingGitCard: true, detectedCards: ['stats'] }]
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockGlobalMetrics)
        });
      }
    });

    await page.goto('/admin/metrics');
    await expect(page.locator('#auth-panel')).toBeVisible();

    // Test invalid key first
    await page.fill('#metrics-key-input', 'wrong-key');
    await page.click('#btn-login-metrics');
    await expect(page.locator('#auth-error-msg')).toContainText('Clave incorrecta');

    // Now login with valid key
    await page.fill('#metrics-key-input', validKey);
    await page.click('#btn-login-metrics');

    await expect(page.locator('#auth-panel')).toBeHidden();
    await expect(page.locator('#analytics-panel')).toBeVisible();

    // Verify key in sessionStorage is encrypted (not plain-text)
    const rawSessionKey = await page.evaluate(() =>
      sessionStorage.getItem('gitcard-studio-metrics-key')
    );
    expect(rawSessionKey?.startsWith('gcs_enc_v1.')).toBe(true);
    expect(rawSessionKey).not.toContain(validKey);

    // Verify KPIs
    await expect(page.locator('#kpi-renders')).toHaveText(/1[.,]250/);
    await expect(page.locator('#kpi-verified')).toHaveText('1');
    await expect(page.locator('#kpi-views')).toHaveText('100');
    await expect(page.locator('#kpi-repo-views')).toHaveText('45');

    // Verify pagination & search
    const tableBody = page.locator('#users-table-body');
    await expect(tableBody.locator('tr')).toHaveCount(10);
    await page.click('#btn-next-page');
    await expect(tableBody.locator('tr')).toHaveCount(5);

    await page.fill('#search-users-input', 'octocat');
    await expect(tableBody.locator('tr')).toHaveCount(1);
    await expect(tableBody).toContainText('@octocat');

    // Trigger batch README audit
    await page.click('#btn-audit-all');
    await expect(page.locator('#audit-status-badge')).toContainText('15 auditados');

    expect(logs.consoleErrors).toEqual([]);
    expect(logs.pageErrors).toEqual([]);
    expect(logs.server5xxErrors).toEqual([]);
  });

  test('8. Help, Documentation & Legal pages load cleanly with 0 console or server errors', async ({
    page
  }) => {
    const logs = attachZeroErrorLogGuards(page);
    const paths = [
      '/help',
      '/help/github-profile',
      '/help/tokens',
      '/help/organizations',
      '/help/security',
      '/help/revocation',
      '/privacy',
      '/terms'
    ];

    for (const path of paths) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1').first()).toBeVisible();
    }

    expect(logs.consoleErrors).toEqual([]);
    expect(logs.pageErrors).toEqual([]);
    expect(logs.server5xxErrors).toEqual([]);
  });

  test('9. Live Backend Integration & Rapid UI Mutation Stress: real API endpoints under rapid changes never emit 429/500 or console errors', async ({
    page
  }) => {
    const logs = attachZeroErrorLogGuards(page);

    // Let non-GitHub-API endpoints hit the real Fastify/NestJS backend directly
    await page.unroute('**/api/config*');
    await page.unroute('**/api/metrics/users/count*');
    await page.unroute('**/api/badge*');

    await page.goto('/');
    await page.fill('#username-input', 'creativecode');
    await page.click('#btn-generate');

    // Perform 12 rapid consecutive UI changes (themes, widths, formats, link style, locale)
    await page.click('#theme-neon');
    await page.click('#theme-glassmorphism');
    await page.click('#theme-light');
    await page.click('#theme-dark');
    await page.click('#width-full');
    await page.click('#width-default');
    await page.selectOption('#format-select', 'png');
    await page.selectOption('#format-select', 'svg');
    await page.selectOption('#link-style-select', 'raw');
    await page.selectOption('#link-style-select', 'linked');
    await page.selectOption('#locale-select', 'en');
    await page.selectOption('#locale-select', 'es');

    // Also fire 15 concurrent requests directly to /api/metrics/users/count & /api/config & /health
    // to verify rate-limit bucket isolation and zero 500 errors
    const statuses = await page.evaluate(async () => {
      const urls = [
        '/api/metrics/users/count',
        '/api/config',
        '/health',
        '/api/badge?username=creativecode&label=Build&message=Passing&color=green',
        '/api/metrics/users/count',
        '/api/config',
        '/api/metrics/users/count',
        '/api/config',
        '/api/metrics/users/count',
        '/api/config'
      ];
      const responses = await Promise.all(urls.map((u) => fetch(u)));
      return responses.map((r) => r.status);
    });

    for (const status of statuses) {
      expect(status).toBe(200);
    }

    expect(logs.consoleErrors).toEqual([]);
    expect(logs.pageErrors).toEqual([]);
    expect(logs.server5xxErrors).toEqual([]);
  });
});
