import { TRANSLATIONS } from './i18n/locales';
import type { SupportedLocale, TranslationKey } from './i18n/types';

export { TRANSLATIONS };
export type { SupportedLocale, TranslationKey };

/**
 * Gets a localized translation string by key for the specified locale.
 * Supports string interpolation via `{paramName}`.
 */
export function t(
  key: TranslationKey,
  locale: string = 'es',
  params?: Record<string, string>
): string {
  const lang = (locale in TRANSLATIONS ? locale : 'es') as SupportedLocale;
  const dict = TRANSLATIONS[lang];
  let text: string = dict[key] || TRANSLATIONS.es[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replaceAll(`{${paramKey}}`, paramVal);
    });
  }

  return text;
}

/**
 * Updates DOM elements containing `[data-i18n]` and `[data-i18n-placeholder]`.
 */
export function updateDomTranslations(locale: string = 'es'): void {
  const lang = (locale in TRANSLATIONS ? locale : 'es') as SupportedLocale;
  const dict = TRANSLATIONS[lang];

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lang;
  }

  // 1. Text elements
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const key = htmlEl.dataset.i18n;
    if (key && key in dict) {
      const val = dict[key as TranslationKey];
      if (val.includes('<') && val.includes('>')) {
        htmlEl.innerHTML = val;
      } else {
        htmlEl.textContent = val;
      }
    }
  });

  // 2. Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const key = htmlEl.dataset.i18nPlaceholder;
    if (key && key in dict) {
      (htmlEl as HTMLInputElement).placeholder = dict[key as TranslationKey];
    }
  });

  // 3. Accessible Labels (aria-label)
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const key = htmlEl.dataset.i18nAriaLabel;
    if (key && key in dict) {
      htmlEl.setAttribute('aria-label', dict[key as TranslationKey]);
    }
  });

  // 4. Tooltips (title)
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const key = htmlEl.dataset.i18nTitle;
    if (key && key in dict) {
      htmlEl.setAttribute('title', dict[key as TranslationKey]);
    }
  });

  // 4. Special Dynamic Elements (e.g. toggle styles button count)
  const toggleBtnText = document.getElementById('btn-toggle-themes-text');
  if (toggleBtnText) {
    const extraThemes = document.querySelectorAll('.theme-extra');
    const isExpanded = extraThemes.length > 0 && !extraThemes[0].classList.contains('hidden');
    const count = String(extraThemes.length || 13);
    toggleBtnText.textContent = isExpanded
      ? t('btn_show_less', lang)
      : t('btn_show_more', lang, { count });
  }
}
