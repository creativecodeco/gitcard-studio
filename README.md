# GitCard Studio - Stats Generator & Live API 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/creativecodeco/github-helpers?style=flat-square)](https://github.com/creativecodeco/github-helpers/stargazers)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub%20Sponsors-ea4aaa?style=flat-square&logo=github)](https://github.com/sponsors/joaltoroc)

[🌐 English Version](#-english-summary--quick-start) | [🇪🇸 Versión en Español](#-documentación-en-español)

---

<a name="-english-summary--quick-start"></a>
## 🌐 English Summary & Quick Start

> **Generate dynamic and customizable SVG cards with your GitHub & Git statistics to showcase your profile and projects.**

**GitCard Studio** is an open-source, production-grade microservice and web application built with **TypeScript, NestJS, and Astro**. It allows you to query real-time general stats, commit activity habits, streak counters, developer ranks, trophies, top repositories, and programming language distributions for any developer profile, generating high-definition vector SVG cards ready to embed directly into your `README.md`.

Developed and maintained by **[CreativeCode.com.co](https://creativecode.com.co)**.

### 🚀 Live Web Generator
Interactively customize and preview your cards in real time at:  
👉 **[https://gitcard-studio.creativecode.com.co/](https://gitcard-studio.creativecode.com.co/)**

### ⚡ Key Features
- **Clean Architecture:** Domain-Driven Design (DDD) with decoupled Domain, Use Cases, Adapters, and Infrastructure layers.
- **Hot Rendering & Base64 Bypass:** On-the-fly SVG generation with image Base64 embedding to ensure GitHub Camo proxy (`camo.githubusercontent.com`) compatibility.
- **Comprehensive Card Suite:**
  - 📊 **General Stats Card:** Commits, stars, PRs, issues, and followers.
  - 💻 **Most Used Languages:** Byte-weighted language distribution with custom legends.
  - 📅 **Commit Habit Heatmap Matrix:** 7x24 weekly hourly commit distribution matrix.
  - 🔥 **Contribution Streak Counter:** Current streak, longest streak, and active days.
  - 🎖️ **Developer Rank:** Automated grade assignment (S+, A+, B, etc.).
  - 🏆 **GitHub Trophies:** Earned milestone achievements.
  - ⭐ **Top Repositories & Featured Repo:** Highlights for top starred projects.
  - 💖 **GitHub Sponsors Card:** Monthly and one-time sponsor overview.
  - 👁️ **Profile Views Badge & Shields.io Badges:** Real-time profile views tracker and custom SVG badges.
- **GitHub App OAuth Integration:** 1-click read-only authentication to aggregate private repositories and organization contributions.
- **OWASP Compliant Security:** Strict regex parameter validation, Helmet headers, IP rate limiting, and encrypted token management.

### 📡 Quick Markdown Usage

```markdown
<!-- General Stats Card -->
![GitHub Stats](https://gitcard-studio.creativecode.com.co/api/stats?username=your-username&theme=dark&locale=en)

<!-- Most Used Languages Card -->
![Top Languages](https://gitcard-studio.creativecode.com.co/api/languages?username=your-username&theme=tokyonight&locale=en)

<!-- Commit Activity Heatmap Matrix -->
![Commit Activity](https://gitcard-studio.creativecode.com.co/api/commit-activity?username=your-username&theme=neon&locale=en)

<!-- Profile Views Badge -->
![Profile Views](https://gitcard-studio.creativecode.com.co/api/badge?username=your-username&type=views&color=38bdf8)
```

---

<a name="-documentación-en-español"></a>
## 🇪🇸 Documentación en Español

> **Genera tarjetas SVG dinámicas y personalizables con tus estadísticas para destacar tu perfil y tus proyectos.**

**GitCard Studio** es un microservicio y cliente web desarrollado en **Node.js con TypeScript, NestJS y Astro**. Permite consultar en tiempo real las estadísticas generales, matriz de hábitos de commit, trofeos y la distribución de lenguajes de cualquier perfil de usuario, generando tarjetas vectoriales (**SVG**) listas para incrustar directamente en tu archivo `README.md`.

Desarrollado y mantenido por **[CreativeCode.com.co](https://creativecode.com.co)**.

---

### 🌐 Generador Web en Vivo

Diseña y personaliza tus tarjetas interactivamente en:  
👉 **[https://gitcard-studio.creativecode.com.co/](https://gitcard-studio.creativecode.com.co/)**

---

## ⚡ Características Principales

1. **Clean Architecture (Arquitectura Limpia):** Estructurado en capas desacopladas (Dominio, Casos de Uso, Adaptadores e Infraestructura) para garantizar mantenibilidad, testabilidad y escalabilidad.
2. **API en Vivo (Hot Rendering):** Generación de tarjetas SVG al vuelo a través de endpoints con cabeceras `Content-Type: image/svg+xml`.
3. **Caché en Memoria (2 horas):** Minimiza las llamadas a la API de GitHub para evitar bloqueos por límite de tasa (Rate Limits) mediante el patrón Decorador.
4. **Imágenes Autocontenidas (Base64 Bypass):** Las fotos de perfil se descargan y se convierten a Base64 en el servidor, garantizando que el proxy de imágenes de GitHub (`camo.githubusercontent.com`) las muestre sin problemas.
5. **Métricas Clave de Visibilidad:**
   - **Estadísticas Generales:** Commits totales, estrellas obtenidas, pull requests, issues y seguidores.
   - **Lenguajes más Usados:** Gráfica de distribución de lenguajes (calculada por peso de bytes) con leyenda estructurada.
   - **Matriz de Hábitos de Commit:** Grilla semanal 7x24 de distribución horaria de commits.
   - **Racha de Contribuciones & Rango:** Cálculo automático de racha activa y grado de desarrollador (S+, A+, B, etc.).
   - **Trofeos y Repositorios Destacados:** Hitos alcanzados y tarjetas de proyectos top.
   - **Perfil de GitHub Sponsors:** Resumen de patrocinadores mensuales y de pago único, estimación de ingresos y grid interactivo de patrocinadores.
   - **Insignias SVG estilo Shields.io:** Badges dinámicos personalizables para visitas de perfil y rango.
6. **Autenticación Directa con GitHub App:** Conexión transparente mediante GitHub OAuth con soporte de **Refresh Tokens** automáticos y permisos de solo lectura de metadata para sumar repositorios privados y organizaciones.
7. **Panel de Métricas del Usuario & GDPR:** Permite a cada usuario autenticado consultar sus propias métricas personales (visitas de perfil y renders de tarjetas) y realizar la eliminación permanente de su cuenta y datos en cualquier momento.
8. **Múltiples Temas Estéticos:** Dark, Light, Neon, Solarized, Radical, Tokyonight y Glassmorphism.
9. **Panel Web Premium (Glassmorphism):** Una interfaz web elegante construida en CSS puro con vista previa en tiempo real y copiador de enlaces Markdown automático.
10. **Generador de README.md de Ejemplo:** Genera automáticamente una plantilla Markdown completa con el saludo al usuario y todas las tarjetas cargadas con éxito.
11. **Guía Integrada para Perfil de GitHub:** Tutorial paso a paso en `/help#github-profile` para crear el repositorio especial `username/username` y desplegar las métricas.
12. **Pruebas Unitarias Integradas:** Implementadas utilizando **Vitest** con inyección de dependencias.
13. **Listo para Docker y Coolify:** Dockerfile de construcción en múltiples etapas (multi-stage) optimizado para producción.

---

## 🏗️ Arquitectura del Proyecto

El código fuente está organizado siguiendo los principios de **Clean Architecture**:

```
src/
├── domain/                  # Lógica de negocio pura (Entidades y Contratos de Repositorios)
│   ├── entities/            # UserStats, LanguageStat, Metrics, UserToken, Validation
│   └── repositories/        # IGitHubRepository, ITokenRepository, IMetricsRepository
├── use-cases/               # Casos de uso (Orquestadores de la lógica de negocio)
│   ├── cards/               # GetUserStatsCardUseCase, GetUserLanguagesCardUseCase, etc.
│   └── tokens/              # RegisterUserTokenUseCase, RevokeUserTokenUseCase
├── adapters/                # Adaptadores de Interfaz (Controladores, Repositorios y Presentadores)
│   ├── controllers/         # CardController, TokenController, MetricsController
│   ├── presenters/          # statsCard, languagesCard, commitActivityCard, badge.presenter (Renderizadores SVGs)
│   └── repositories/        # TypeORMTokenRepository, TypeORMMetricsRepository, ApiGitHubRepository, CachedGitHubRepository
└── infrastructure/          # Detalles técnicos concretos (Base de datos, Servidor Express/Fastify, Criptografía)
    ├── database/            # Configuración de TypeORM con PostgreSQL y Entidades
    │   └── entities/        # Entidades de base de datos (GlobalMetric, UserMetric, etc.)
    ├── express/             # Enrutamiento, middlewares y arranque de servidor
    ├── security/            # Criptografía AES-256-GCM y validación de scopes
    └── server.ts            # Entrypoint principal
```

### Path Aliases (Alias de Rutas)

El proyecto utiliza alias `@/` apuntando al directorio `src/`. Esto previene la existencia de rutas relativas complejas como `../../`.

- En desarrollo: Se resuelve en tiempo de ejecución utilizando `tsconfig-paths/register`.
- En producción: `tsc-alias` reescribe los imports a rutas relativas nativas durante la compilación en el directorio `dist/`.

---

## 🚀 Comenzar (Desarrollo Local)

### Requisitos previos

- Node.js v18 o superior.
- Gestor de paquetes **pnpm** (exclusivo del repositorio).
- (Opcional) Un token de acceso personal (PAT) de GitHub para aumentar el límite de peticiones de la API.

### Instalación

1. Clona e ingresa al repositorio.
2. Instala las dependencias estables usando `pnpm`:
   ```bash
   pnpm install
   ```
3. Copia el archivo de configuración de entorno:
   ```bash
   cp .env.example .env
   ```
4. Abre el archivo `.env` y configura las siguientes variables clave:
   - `GITHUB_TOKEN`: Tu token de acceso personal de GitHub para evitar límites de tasa.
   - `METRICS_KEY`: Clave secreta obligatoria para poder acceder a los endpoints de analíticas (`/api/metrics`).
   - `TRUST_PROXY`: Número de saltos del proxy (por defecto `1`), útil para que el rate limit identifique correctamente las IPs detrás de Cloudflare, Nginx, etc.
   - `PRIVATE_STATS_COMING_SOON`: Estado de configuración de estadísticas privadas. Establécelo en `false` para habilitar y activar completamente la funcionalidad de registro/revocación de tokens (por defecto `true`).
   - `STATS_HISTORY_FREQUENCY_HOURS`: Frecuencia mínima en horas entre tomas de instantáneas del historial de estadísticas del usuario (por defecto `12`).

### Scripts de Desarrollo

- **Modo Desarrollo (auto-reload y resolución de paths):**
  ```bash
  pnpm dev
  ```
- **Ejecutar Pruebas Unitarias (Vitest):**
  ```bash
  pnpm test
  ```
- **Compilar para Producción (compila archivos TS y reescribe alias):**
  ```bash
  pnpm build
  ```
- **Iniciar Servidor Compilado:**
  ```bash
  pnpm start
  ```
- **Gestionar Versiones y Releases (release-it):**
  ```bash
  pnpm release
  ```

Una vez ejecutado, el panel de configuración estará disponible en:  
👉 **http://localhost:3000**

---

## 📡 Endpoints de la API

Las tarjetas se pueden incrustar en cualquier archivo Markdown usando la siguiente sintaxis:

| Endpoint | Descripción | Ejemplo de Uso |
| :--- | :--- | :--- |
| `/api/stats` | Estadísticas generales (commits, PRs, estrellas, seguidores) | `![Stats](https://gitcard-studio.creativecode.com.co/api/stats?username=tu-usuario&theme=dark)` |
| `/api/languages` | Gráfico de distribución de lenguajes | `![Languages](https://gitcard-studio.creativecode.com.co/api/languages?username=tu-usuario&theme=tokyonight)` |
| `/api/commit-activity` | Matriz semanal 7x24 de hábitos de commit | `![Commit Activity](https://gitcard-studio.creativecode.com.co/api/commit-activity?username=tu-usuario&theme=neon)` |
| `/api/streak` | Racha de contribuciones activas y récords | `![Streak](https://gitcard-studio.creativecode.com.co/api/streak?username=tu-usuario&theme=radical)` |
| `/api/rank` | Tarjeta de grado / rango de desarrollador (S+, A+, B) | `![Rank](https://gitcard-studio.creativecode.com.co/api/rank?username=tu-usuario&theme=glassmorphism)` |
| `/api/trophies` | Trofeos e hitos alcanzados en GitHub | `![Trophies](https://gitcard-studio.creativecode.com.co/api/trophies?username=tu-usuario&theme=dark)` |
| `/api/top-repos` | Tarjeta con los repositorios más destacados | `![Top Repos](https://gitcard-studio.creativecode.com.co/api/top-repos?username=tu-usuario&theme=solarized)` |
| `/api/sponsors` | Tarjeta del perfil de GitHub Sponsors | `![Sponsors](https://gitcard-studio.creativecode.com.co/api/sponsors?username=tu-usuario&theme=neon)` |
| `/api/badge` | Insignia SVG estilo Shields.io / Contador de visitas | `![Views](https://gitcard-studio.creativecode.com.co/api/badge?username=tu-usuario&type=views&color=38bdf8)` |

#### **Parámetros Comunes:**
- `username` (Obligatorio): Nombre de usuario u organización en GitHub. Valida con regex `/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i`.
- `theme` (Opcional): `dark` (por defecto), `light`, `neon`, `glassmorphism`, `solarized`, `radical`, `tokyonight`.
- `locale` o `lang` (Opcional): `es` (Español, por defecto) o `en` (Inglés). Traduce dinámicamente los textos internos de la tarjeta.

---

## 📊 Panel de Administración de Métricas (`/admin/metrics`)

El servicio cuenta con una interfaz web segura de analíticas en la dirección `/admin/metrics`.

- **Acceso:** Protegido mediante un formulario de autenticación glassmorphic que valida contra la clave configurada en la variable de entorno `METRICS_KEY`.
- **Analíticas en Tiempo Real:**
  - Métricas KPI para renderizados totales, usuarios únicos registrados y vistas de insignias de perfil.
  - Gráfico de dona (Doughnut) de distribución de tipos de tarjetas solicitadas.
  - Gráfico de barras apiladas (Stacked Bar) de tráfico por origen (GitHub Camo vs Web Directa).
  - Listado de usuarios/perfiles más activos con fecha de última actualización y hits de perfil.

---

## 🔒 Seguridad (Alineación OWASP)

Este microservicio implementa las siguientes medidas de seguridad para entornos de producción:

- **Cabeceras Seguras (Helmet)**: Configurado con políticas de recursos de origen cruzado (`cross-origin`) para permitir incrustar de forma segura las tarjetas en READMEs externos.
- **Rate Limiting**: Límite de 100 peticiones cada 15 minutos por dirección IP. En caso of bloqueo, responde con un SVG legible para evitar errores de renderizado de imágenes.
- **Validación de Parámetros por Expresión Regular**:
  - Validado a nivel de Controller y en la capa de negocio de Use Cases.
  - Username: `/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i`
  - Repo: `/^[a-z\d-_.]{1,100}$/i`
- **Secure by Default**: Los endpoints de métricas se bloquean por defecto con error `403` si no se configura la variable `METRICS_KEY`.

Para obtener información detallada sobre reporte responsable de vulnerabilidades y políticas de parches, consulta nuestra **[Política de Seguridad (SECURITY.md)](SECURITY.md)**.

---

## 💖 GitHub Sponsors Profile / Apoya el Proyecto

Si este proyecto te resulta útil para personalizar tu perfil de GitHub o tus repositorios, puedes apoyar su desarrollo y mantenimiento continuo a través de **GitHub Sponsors**:

👉 **[https://github.com/sponsors/joaltoroc](https://github.com/sponsors/joaltoroc)**

[![Sponsor en GitHub](https://img.shields.io/badge/Sponsor-GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/joaltoroc)

---

## 🤝 Contribución

Consulta nuestra **[Guía de Contribución (CONTRIBUTING.md)](CONTRIBUTING.md)** para conocer las normas de estilo, la arquitectura del proyecto y cómo enviar un Pull Request.

---

## 📄 Licencia

Este proyecto está bajo la licencia **[MIT](LICENSE)**.

---

## 🐳 Despliegue en Docker y Coolify

Este proyecto incluye un `Dockerfile` optimizado con builds en multi-etapa y configuración segura que se ejecuta bajo el usuario no root `node`.

### Despliegue en Coolify

1. Crea un nuevo recurso de tipo **Application** en tu panel de Coolify.
2. Selecciona **GitHub Repository** como fuente y apunta a este repositorio.
3. En la configuración de construcción, selecciona **Dockerfile**.
4. Configura el puerto de exposición en el puerto `3000`.
5. **Base de Datos**: Añade un servicio de base de datos **PostgreSQL** en Coolify.
6. **Variables de Entorno**: Agrega los datos de acceso de la base de datos y tus tokens de seguridad:
   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `GITHUB_TOKEN`, `METRICS_KEY`, `TRUST_PROXY`.
7. Haz clic en **Deploy**. Coolify construirá el contenedor seguro de producción y lo pondrá en marcha con SSL automático.
