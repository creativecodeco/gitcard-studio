# Directivas del Agente de Arquitectura

Este archivo define las reglas obligatorias de estructura y arquitectura Clean para todo agente o desarrollador en **GitCard Studio**.

## 1. Escaneo Obligatorio Pre-Commit
Antes de finalizar cualquier tarea que altere la estructura de carpetas, dependencias o módulos en el backend o frontend, se DEBE ejecutar:

```bash
pnpm architecture:scan
```

## 2. Reglas Estrictas de Arquitectura
1. **Aislamiento de la Capa Domain**: `backend/src/domain` no debe importar módulos de `infrastructure`, `adapters`, `modules` ni librerías de infraestructura externa (Fastify, NestJS, TypeORM).
2. **Desacoplamiento de Casos de Uso**: Los casos de uso (`use-cases/`) deben depender exclusivamente de interfaces de repositorio e interactuar con entidades de dominio.
3. **Sincronización de Versiones Monorepo**: La propiedad `"version"` debe coincidir exactamente en `package.json`, `backend/package.json` y `frontend/package.json`.
4. **Sincronización de Documentación**: Toda modificación arquitectónica o de despliegue requiere actualizar `README.md`, `CHANGELOG.md` y `.agents/ARCHITECTURE.md`.
