# Directivas del Agente de Gestión de Dependencias (Dependency Agent)

Este archivo define las reglas obligatorias de auditoría, sincronización y actualización de dependencias en los paquetes del monorepo **GitCard Studio** (`package.json`, `backend/package.json`, `frontend/package.json`).

## 1. Escaneo Obligatorio Pre-Commit
Antes de dar por completada cualquier tarea que agregue, modifique o actualice dependencias, se DEBE ejecutar el análisis de dependencias:

```bash
pnpm deps:scan
```

## 2. Reglas Estrictas de Dependencias
1. **Versiones Exactas Obligatorias**: Prohibido el uso de prefijos de rango (`^`, `~`, `>=`, `*`) en `dependencies` y `devDependencies`. Todas las dependencias deben declararse con su versión exacta fija (ej. `"12.0.1"`).
2. **Sincronización en Monorepo**: Las dependencias compartidas entre múltiples paquetes (ej. `typescript`, `vitest`, `@types/node`) DEBEN tener exactamente la misma versión en todos los archivos `package.json`.
3. **Uso Exclusivo de pnpm**: Prohibido ejecutar `npm install` o `yarn`. Toda instalación y actualización debe realizarse mediante `pnpm` o `pnpm up`.
4. **Integridad de Lockfile**: El archivo `pnpm-lock.yaml` debe reflejar fielmente las versiones exactas sin `overrides` obsoletos o conflictos de pares.
5. **Ubicación de Herramientas de Desarrollo**: Herramientas de análisis global (`eslint`, `prettier`) deben residir en el `package.json` raíz; dependencias específicas de backend o frontend deben residir en sus respectivos paquetes.
