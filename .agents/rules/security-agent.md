# Directivas del Agente de Ciberseguridad

Este archivo define las reglas obligatorias de ciberseguridad para todo agente o desarrollador que modifique la base de código de **GitCard Studio**.

## 1. Escaneo Obligatorio Pre-Commit
Antes de dar por completada cualquier tarea que agregue, refactorice o altere código fuente (backend, frontend Astro, presentadores SVG o entidades de base de datos), se DEBE ejecutar la habilidad `cybersecurity-agent` o la herramienta de análisis estático:

```bash
pnpm security:scan
```

## 2. Reglas Estrictas de Seguridad OWASP
1. **Fuga de Credenciales**: Nunca incluir tokens, secretos JWT, claves privadas o cadenas de conexión a BD con contraseñas en texto plano dentro del código o logs.
2. **Escapado de SVG y DOM**: Todo input del usuario (`username`, `repo`, etiquetas, colores) insertado dentro de elementos SVG o plantillas HTML DEBE ser filtrado usando `escapeXml`, `escapeHtml` o `sanitizeColor`.
3. **Validación de Parámetros**: Validar todos los parámetros de consulta HTTP mediante expresiones regulares estrictas antes de procesarlos.
4. **Seguridad en Base de Datos**: Utilizar exclusivamente QueryBuilder o Repositorios de TypeORM parametrizados para evitar Inyección SQL.
5. **SSRF & Autenticación de Métricas**: Validar dominios objetivo en llamadas HTTP salientes y exigir la clave `METRICS_KEY` para acceder a `/api/metrics`.
