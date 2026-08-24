# Directivas del Agente de Integridad de Código

Este archivo define las reglas obligatorias de calidad de código y formato para todo agente o desarrollador que modifique **GitCard Studio**.

## 1. Escaneo Obligatorio Pre-Commit
Antes de finalizar cualquier tarea que altere código fuente en backend o frontend, se DEBE ejecutar la verificación de integridad:

```bash
pnpm integrity:scan
```

## 2. Reglas Estrictas de Integridad y Limpieza
1. **Formato Prettier**: Ningún archivo con código desalineado o sin formato debe ser enviado al repositorio. Usar `pnpm format`.
2. **ESLint Sin Incidencias**: El comando `pnpm lint` debe arrojar `0` errores y `0` advertencias.
3. **Limpieza de Código Muerto**: Prohibido dejar bloques de código fuente comentados (`// const x = ...`), importaciones no utilizadas o variables inactivas.
4. **Principios DRY**: Reutilizar siempre helpers centralizados (como `renderBrandHeader` en presentadores SVG o `escapeXml` en sanitización) en lugar de duplicar lógica.
5. **Tipado TypeScript Inmutable**: Utilizar `readonly` en miembros de clase privados o propiedades inicializadas que no se reasignan.
