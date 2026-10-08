import type { es } from './locales/es';

export type SupportedLocale = 'es' | 'en' | 'fr' | 'de' | 'pt' | 'ja' | 'zh';
export type TranslationKey = keyof typeof es;
export type LocaleDictionary = Record<TranslationKey, string>;
