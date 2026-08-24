# Directivas del Agente de Buenas Prácticas

Este archivo define las reglas obligatorias de patrones de desarrollo y programación defensiva en **GitCard Studio**.

## 1. Escaneo Obligatorio Pre-Commit
Antes de dar por completada cualquier tarea, se DEBE ejecutar el análisis de buenas prácticas:

```bash
pnpm best-practices:scan
```

## 2. Reglas Estrictas de Patrones
1. **Programación Defensiva y Cláusulas de Guardia**: Tratar primero la condición de falla/negación en cláusulas `if` (`if (!param) { return ...; }`) para evitar anidamiento.
2. **Propiedades Inmutables (`readonly`)**: Marcar todas las dependencias inyectadas en constructores y propiedades de clase como `readonly`.
3. **Validación de Parámetros de Consulta**: Verificar explícitamente el tipo `typeof req.query.x === 'string'` antes de utilizar parámetros HTTP.
4. **Gestión de Paquetes y Versiones**: Usar exclusivamente `pnpm`. No instalar paquetes con prefijos `^` o `~` en `package.json`.
5. **Aislamiento en Docker**: Garantizar que el contenedor ejecute la app bajo `USER node`.
