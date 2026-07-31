# Contributing to GitCard Studio / Guía de Contribución 🤝

[🌐 English](#-english-contributing-guide) | [🇪🇸 Español](#-guía-de-contribución-en-español)

---

<a name="-english-contributing-guide"></a>
## 🌐 English Contributing Guide

Thank you for your interest in contributing to **GitCard Studio**! We welcome bug fixes, feature enhancements, documentation improvements, and architectural suggestions.

Please take a moment to review these guidelines and our **[Code of Conduct (CODE_OF_CONDUCT.md)](CODE_OF_CONDUCT.md)** before submitting a Pull Request (PR) or creating an Issue.

---

### 📋 Code of Conduct & Principles

1. **Clean Architecture:** Keep domain business logic isolated from HTTP controllers and technical frameworks. Use Cases orchestrate business rules.
2. **Security & OWASP First:** Never disable authorization or validation checks. All inputs must be strictly validated with regular expressions.
3. **No Unused Code:** Ensure zero unused variables, functions, or imports (`@typescript-eslint/no-unused-vars`).
4. **Strict SVG Error Responses:** Card endpoints must always respond with `Content-Type: image/svg+xml` and an SVG error representation (e.g. using `renderErrorCard()`) so images render properly inside GitHub `<img>` tags.

---

### 🛠️ Development Workflow

#### 1. Package Manager Standard
We use **`pnpm`** exclusively. Do **not** use `npm` or `yarn`.
```bash
pnpm install
```

#### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```
Fill in required keys manually (`GITHUB_TOKEN`, `METRICS_KEY`). **Never check in `.env` files.**

#### 3. Running Development Servers
```bash
pnpm dev
```

#### 4. Testing & Verification
All unit tests and builds must pass clean before creating a PR:
```bash
# Run unit tests
pnpm test

# Run build verification
pnpm run build
```

---

### 📝 Commit Message Format
We follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification:

- `feat:` A new feature for the user
- `fix:` A bug fix for the user
- `docs:` Documentation changes only
- `refactor:` Code refactoring without changing public API behavior
- `test:` Adding missing tests or correcting existing tests
- `chore:` Maintenance tasks, dependency updates, build configurations

*Example:* `feat: add new commit habits heatmap presenter`

---

<a name="-guía-de-contribución-en-español"></a>
## 🇪🇸 Guía de Contribución en Español

¡Gracias por tu interés en contribuir a **GitCard Studio**! Apreciamos las correcciones de errores, nuevas tarjetas, mejoras en la interfaz web y optimizaciones en la documentación.

Por favor, tómate un momento para revisar estas reglas antes de abrir un Pull Request (PR) o una Issue.

---

### 📋 Principios y Reglas de Desarrollo

1. **Arquitectura Limpia (Clean Architecture):** Mantén la lógica de negocio pura aislada de controladores e infraestructura técnica. Los Casos de Uso (`use-cases`) orquestan las operaciones.
2. **Seguridad OWASP por Defecto:** Nunca deshabilites validaciones de entrada ni autorizaciones. Los nombres de usuario y repositorios deben validarse estrictamente con expresiones regulares.
3. **Código Limpio y Sin Símbolos Obsoletos:** No dejes variables, tipos o importaciones en desuso (`@typescript-eslint/no-unused-vars`).
4. **Respuestas SVG en Errores:** Todos los endpoints de tarjetas deben devolver `Content-Type: image/svg+xml` y representar errores como tarjetas SVG válidas (`renderErrorCard()`), permitiendo que GitHub Camo las renderice en archivos Markdown.

---

### 🛠️ Flujo de Trabajo

#### 1. Gestor de Paquetes
Utilizamos **`pnpm`** de forma exclusiva. **No** ejecutes `npm install` ni `yarn`.
```bash
pnpm install
```

#### 2. Configuración de Entorno
```bash
cp .env.example .env
```
Configura manualmente las llaves necesarias (`GITHUB_TOKEN`, `METRICS_KEY`). **Nunca incluyas archivos `.env` con secretos en tus commits.**

#### 3. Ejecución en Desarrollo
```bash
pnpm dev
```

#### 4. Verificación y Pruebas
Tu contribución debe pasar todas las pruebas unitarias y el build estático antes de solicitar la revisión:
```bash
# Ejecutar suite de pruebas con Vitest
pnpm test

# Verificar compilación estática y backend
pnpm run build
```

---

### 📝 Formato de Commits
Seguimos la convención de **Conventional Commits**:

- `feat:` Nueva funcionalidad o tarjeta
- `fix:` Corrección de errores o linter
- `docs:` Cambios únicamente en documentación
- `refactor:` Reestructuración de código sin alterar el comportamiento externo
- `test:` Inclusión o actualización de pruebas unitarias
- `chore:` Tareas de mantenimiento o dependencias

*Ejemplo:* `fix: correct SVG element clipping in rank presenter`
