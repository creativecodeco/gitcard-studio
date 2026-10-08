# Reglas de Sincronización y Modularidad de i18n

Este documento establece las directivas obligatorias para la gestión de internacionalización (i18n) en **GitCard Studio**.

## 1. Estructura Modular por Idioma
El sistema i18n del frontend se organiza en archivos individuales por idioma en la carpeta `frontend/src/utils/i18n/locales/`:
- `es.ts` (Diccionario principal de referencia en Español)
- `en.ts` (Inglés)
- `fr.ts` (Francés)
- `de.ts` (Alemán)
- `pt.ts` (Portugués)
- `ja.ts` (Japonés)
- `zh.ts` (Chino)
- `types.ts` (Definición estricta de tipos de llaves)

## 2. Garantía de Sincronización Estricta mediante TypeScript
1. **Tipo Base**: La interfaz de llaves `TranslationKey` se deriva directamente de las llaves de `es.ts` (`export type TranslationKey = keyof typeof es`).
2. **Contrato de Idiomas**: Todos los demás archivos de idioma (`en.ts`, `fr.ts`, `de.ts`, `pt.ts`, `ja.ts`, `zh.ts`) DEBEN declarar explícitamente el tipo `LocaleDictionary` (`Record<TranslationKey, string>`).
3. **Verificación en Compilación**: Si se agrega una nueva clave de traducción a `es.ts`, el compilador de TypeScript (`pnpm build`) marcará error de compilación inmediatamente en todos los idiomas a los que les falte dicha clave.

## 3. Workflow al Añadir Nuevas Cadenas de Texto
1. **Añadir la clave en `es.ts`**: Definir la nueva propiedad en `frontend/src/utils/i18n/locales/es.ts`.
2. **Añadir la traducción correspondiente en todos los archivos**: `en.ts`, `fr.ts`, `de.ts`, `pt.ts`, `ja.ts`, `zh.ts`.
3. **Usar atributos en componentes HTML/Astro**: Usar `data-i18n="clave"`, `data-i18n-placeholder="clave"` o `data-i18n-aria-label="clave"`.
4. **Verificar pruebas de sincronización**: Ejecutar `pnpm test` para asegurar que la prueba de paridad de llaves en `frontend/tests/i18nFrontend.test.ts` pase exitosamente.
