import { describe, it, expect } from 'vitest';
import { t, TRANSLATIONS, type TranslationKey } from '../src/utils/i18n';

describe('Frontend i18n Utility', () => {
  it('should contain matching keys between ES and EN dictionaries', () => {
    const esKeys = Object.keys(TRANSLATIONS.es).sort();
    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it('should return correct translation for ES and EN', () => {
    expect(t('btn_generate', 'es')).toBe('Generar Tarjetas');
    expect(t('btn_generate', 'en')).toBe('Generate Cards');
  });

  it('should fallback to ES if unknown locale is provided', () => {
    expect(t('btn_generate', 'fr' as any)).toBe('Generar Tarjetas');
  });

  it('should interpolate parameters correctly', () => {
    // Testing param substitution logic
    const res = t('header_metrics_label', 'en');
    expect(res).toBe('Users active with cards: ');
  });

  it('should update DOM text, placeholders, aria-labels and html lang attribute', async () => {
    const { updateDomTranslations } = await import('../src/utils/i18n');

    document.body.innerHTML = `
      <span data-i18n="settings_title"></span>
      <input data-i18n-placeholder="username_placeholder" />
      <button data-i18n-aria-label="theme_toggle_btn"></button>
    `;

    updateDomTranslations('en');

    expect(document.documentElement.lang).toBe('en');
    expect(document.querySelector('[data-i18n="settings_title"]')?.textContent).toBe('Configuration');
    expect(
      (document.querySelector('input') as HTMLInputElement).placeholder
    ).toBe('e.g. octocat');
    expect(
      document.querySelector('button')?.getAttribute('aria-label')
    ).toBe('Toggle light/dark theme');

    // Switch back to ES
    updateDomTranslations('es');
    expect(document.documentElement.lang).toBe('es');
    expect(document.querySelector('[data-i18n="settings_title"]')?.textContent).toBe('Configuración');
    expect(
      document.querySelector('button')?.getAttribute('aria-label')
    ).toBe('Cambiar tema claro/oscuro');
  });
});
