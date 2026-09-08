# Architecture Decision Records — GitCard Studio

> **Mantenimiento**: Este archivo debe actualizarse en cada PR que cambie la arquitectura, rutas, variables de entorno, dependencias principales o comportamientos clave del frontend/backend. Los agentes de IA deben actualizar este documento con cada cambio significativo.

---

## Estado actual: 2026-09-07 (v1.11.0)

### Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | 24 |
| Backend | NestJS + Fastify + TypeScript | 12.0.1 / 5.12.1 / 7.0.2 |
| Frontend | Astro (SSG estático) | 7.3.1 |
| Base de datos | PostgreSQL + TypeORM | 8.23.0 / 1.1.1 |
| Package Manager | pnpm (monorepo) | 12.3.4 |
| Contenedor | Docker multi-stage, node:24-alpine | — |
| CSS | Vanilla CSS (global.css) | — |
| Tests | Vitest | 5.0.0 |

---

## Estructura del Proyecto

```
gitcard-studio/
├── backend/                      # Backend (NestJS + Fastify / TypeScript) — Clean Architecture
│   ├── src/
│   │   ├── adapters/
│   │   │   ├── presenters/       # SVG card renderers (stats, languages, repo, rank, streak, trophies, viewsBadge, etc.)
│   │   │   └── repositories/    # ApiGitHubRepository, CachedGitHubRepository, TypeORM repos
│   │   ├── domain/
│   │   │   ├── entities/         # UserStats, RepoStats, StreakStats, Metrics, Validation
│   │   │   └── repositories/    # IGitHubRepository, IMetricsRepository, ITokenRepository
│   │   ├── infrastructure/
│   │   │   ├── cache/            # RedisCacheAdapter, MemoryCacheAdapter (LRU cache)
│   │   │   ├── config/           # Validación estricta de entorno con class-validator (env.config.ts)
│   │   │   ├── database/         # TypeORM DataSource + entidades PostgreSQL
│   │   │   ├── filters/          # AllExceptionsFilter
│   │   │   ├── i18n/             # Internacionalización backend (es / en)
│   │   │   ├── logging/          # Logger estructurado Winston y formateador
│   │   │   └── security/        # AES-256 token encryption, consent fingerprint, scope validation
│   │   ├── modules/              # NestJS Feature Modules & Controllers
│   │   │   ├── api-v1/           # ApiV1Module & ApiV1Controller (/api/v1/user/stats)
│   │   │   ├── auth/             # AuthModule & AuthController (/api/auth/*, /api/users/me/*)
│   │   │   ├── cards/            # CardsModule & CardsController (/api/stats, /api/languages, /api/commit-activity, etc.)
│   │   │   ├── metrics/          # MetricsModule & MetricsController (/api/metrics, /api/config)
│   │   │   ├── root/             # RootController (GET /, /health, /admin/metrics, /help, /privacy)
│   │   │   ├── tokens/           # TokensModule & TokensController (/api/tokens/*, /api/users/purge, /api/users/export)
│   │   │   └── webhooks/         # WebhooksModule & WebhooksController (/api/webhooks/github)
│   │   ├── use-cases/            # Use cases puros (cards, history, metrics, tokens, users)
│   │   ├── utils/                # Utilidades puras (escape, XML sanitization, minificación SVG)
│   │   ├── app.module.ts         # NestJS Root Module
│   │   ├── main.ts               # NestJS Fastify bootstrap con compresión, ETags y Helmet
│   │   └── server.ts             # Punto de entrada de inicio de servidor
│   └── tests/                    # Vitest unit tests backend (32 archivos, 146 tests pasados)
├── frontend/                     # Astro 7 — cliente web estático interactivo
│   ├── astro.config.mjs          # outDir: ../public, format: file, compressHTML: true
│   ├── src/
│   │   ├── layouts/BaseLayout.astro  # DNS prefetch, Google Analytics gtag, CSP-compatible meta tags
│   │   ├── components/               # CardPreview, ThemeToggle, PrivateTokenModal, Footer
│   │   ├── pages/                    # index.astro, help.astro, privacy.astro, sitemap.xml.ts
│   │   └── styles/global.css
│   └── tests/                    # Vitest tests frontend (3 archivos, 10 tests pasados)
├── Dockerfile                    # Multi-stage: builder + runner (non-root node user)
├── pnpm-workspace.yaml           # Config monorepo + allowBuilds + minimumReleaseAgeExclude
└── .agents/
    ├── AGENTS.md                 # Reglas de seguridad y patrones para agentes de IA
    ├── ARCHITECTURE.md           # Este archivo — ADR del proyecto
    ├── rules/                    # Reglas individuales por agente de calidad/seguridad
    └── skills/                   # Habilidades especializadas y scripts de escaneo automatizado
```

---

## Rutas API (NestJS Fastify Controllers)

| Método | Ruta | Handler | Autenticación / Propósito |
|--------|------|---------|---------------------------|
| GET | `/api/stats` | `CardsController.getStats` | Pública, CORS `*`, SVG |
| GET | `/api/languages` | `CardsController.getLanguages` | Pública, CORS `*`, SVG |
| GET | `/api/repo` | `CardsController.getRepo` | Pública, CORS `*`, SVG |
| GET | `/api/rank` | `CardsController.getRank` | Pública, CORS `*`, SVG |
| GET | `/api/streak` | `CardsController.getStreak` | Pública, SVG |
| GET | `/api/trophies` | `CardsController.getTrophies` | Pública, SVG |
| GET | `/api/commit-activity` | `CardsController.getCommitActivity` | Pública, SVG |
| GET | `/api/sponsors` | `CardsController.getSponsors` | Pública, SVG |
| GET | `/api/today-status` | `CardsController.getTodayStatus` | Pública, SVG |
| GET | `/api/timeline-matrix` | `CardsController.getTimelineMatrix` | Pública, SVG |
| GET | `/api/badge` | `CardsController.getBadge` | Pública, SVG estilo Shields.io |
| GET | `/api/views` | `CardsController.getProfileViews` | Pública, `no-cache`, SVG |
| GET | `/api/top-repos` | `CardsController.getTopRepos` | Pública, CORS `*`, SVG |
| GET | `/api/v1/user/stats` | `ApiV1Controller.getUserStatsJson` | Pública, JSON agregado |
| GET | `/api/auth/github` | `AuthController.initiateGitHubAuth` | Redirección OAuth GitHub App |
| GET | `/api/auth/github/callback` | `AuthController.handleGitHubCallback` | Callback OAuth GitHub App |
| GET | `/api/users/me/metrics` | `AuthController.getUserMetrics` | Métricas personales del usuario |
| DELETE | `/api/users/me` | `AuthController.deleteUserAccount` | Purga autoverificada de datos |
| POST | `/api/auth/disconnect` | `AuthController.disconnectAccount` | Desconexión de cuenta GitHub |
| POST | `/api/tokens/register` | `TokensController.register` | Validado via DTO (PAT) |
| DELETE | `/api/tokens/revoke` | `TokensController.revoke` | Validado via DTO |
| DELETE | `/api/users/purge` | `TokensController.purge` | Validado via DTO (GDPR) |
| POST | `/api/users/export` | `TokensController.exportData` | Validado via DTO (GDPR export) |
| POST | `/api/webhooks/github` | `WebhooksController.handleGitHubWebhook` | HMAC SHA-256 opcional |
| GET | `/api/metrics` | `MetricsController.getMetrics` | `METRICS_KEY` requerida |
| GET | `/api/metrics/history` | `MetricsController.getRendersHistory` | `METRICS_KEY` requerida |
| GET | `/api/metrics/users` | `MetricsController.getUserMetrics` | `METRICS_KEY` requerida |
| GET | `/api/metrics/users/count` | `MetricsController.getUniqueUsersCount` | Pública |
| GET | `/api/config` | `MetricsController.getConfig` | Pública |
| GET | `/health` | `RootController.getHealth` | Pública |
| GET | `/admin/metrics` | `RootController.getAdminMetrics` | UI de administración de métricas |
| GET | `/help` | `RootController.getHelp` | UI de ayuda y documentación |
| GET | `/help/:slug` | `RootController.getHelpSubPage` | UI de subpáginas de ayuda |
| GET | `/privacy` | `RootController.getPrivacy` | UI de política de privacidad |
| GET | `/` | `RootController.getRoot` | Servido dinámicamente con SEO sanitizado |

---

## Variables de Entorno

| Variable | Requerida | Propósito |
|---|---|---|
| `DATABASE_URL` | Opcional | Cadena de conexión PostgreSQL (prioritaria si se define) |
| `DB_HOST` | ✅ Sí* | Host del servidor PostgreSQL (*si no se usa `DATABASE_URL`) |
| `DB_PORT` | ✅ Sí* | Puerto PostgreSQL (default: `5432`) |
| `DB_DATABASE` | ✅ Sí* | Nombre de la base de datos PostgreSQL |
| `DB_USERNAME` | ✅ Sí* | Usuario de PostgreSQL |
| `DB_PASSWORD` | ✅ Sí* | Contraseña de PostgreSQL |
| `DB_SSL` | ✅ Sí | `true`/`false` para habilitar SSL en PostgreSQL |
| `DB_SYNCHRONIZE` | ✅ Sí | `true`/`false` para sincronización de esquema TypeORM |
| `ENCRYPTION_KEY` | ✅ Sí | 64 caracteres hex para cifrado AES-256-GCM de tokens |
| `METRICS_KEY` | ✅ Sí | Clave secreta para endpoints `/api/metrics` (403 si falta) |
| `GITHUB_TOKEN` | ✅ Sí | PAT de GitHub para tasa elevada en API pública (5.000 req/h) |
| `GITHUB_CLIENT_ID` | No | Client ID para autenticación OAuth de GitHub App |
| `GITHUB_CLIENT_SECRET` | No | Client Secret para autenticación OAuth de GitHub App |
| `GITHUB_CALLBACK_URL` | No | URL de callback OAuth de GitHub App |
| `GITHUB_WEBHOOK_SECRET` | No | Secreto HMAC para validar webhooks de GitHub |
| `STATS_HISTORY_FREQUENCY_HOURS` | No | Horas mínimas entre snapshots de estadísticas (default: `12`) |
| `REDIS_HOST` / `REDIS_URL` | No | Host o URL de conexión para caché Redis distribuida |
| `REDIS_PORT` / `REDIS_PASSWORD` / `REDIS_DB` | No | Parámetros adicionales de conexión a Redis |
| `PORT` | No | Puerto de escucha del servidor (default: `3000`) |
| `NODE_ENV` | No | Entorno de ejecución (`production` / `development`) |

---

## Seguridad (OWASP)

- **Validación de inputs**: DTOs y expresiones regulares estrictas en parámetros de entrada (`ValidationPipe`):
  - Username: `/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i`
  - Repo: `/^[a-z\d-_.]{1,100}$/i`
  - Color: componentes Hex, RGB/RGBA y HSL/HSLA reconstruidos numéricamente (`sanitizeColor`)
  - Label: barrera formal de sanitización con clase invertida (`sanitizeBadgeLabel`)
- **Fastify Helmet**: `@fastify/helmet` con `contentSecurityPolicy: false` para renderizado de SVG inline en etiquetas `<img>`.
- **Rendimiento HTTP**: `@fastify/compress` (Brotli/Gzip) y `@fastify/etag` (304 Not Modified).
- **Control de Tasa**: Configurado en la capa de infraestructura HTTP (`@fastify/rate-limit`).
- **METRICS_KEY**: obligatoria — retorna `403` si no está configurada o `401` si no coincide.
- **Tokens**: AES-256-GCM cifrados en reposo con IVs únicos por token, fingerprint de consentimiento con SHA-256.
- **Error responses en tarjetas**: siempre `Content-Type: image/svg+xml` (SVG `renderErrorCard`) con `Cache-Control: no-cache, no-store, must-revalidate`.
