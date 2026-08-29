import { describe, it, expect } from 'vitest';
import { extractThemeOverrides, extractCardWidth } from '@/modules/cards/card-query.helpers';

describe('card-query.helpers.ts', () => {
  describe('extractThemeOverrides', () => {
    it('should parse canonical and alias theme color parameters', () => {
      const query = {
        bg: '#000000',
        text_color: '#ffffff',
        icon_color: '#ff0000',
        border: '38bdf8',
        lang: 'en'
      };

      const result = extractThemeOverrides(query);
      expect(result.bg).toBe('#000000');
      expect(result.text).toBe('#ffffff');
      expect(result.accent).toBe('#ff0000');
      expect(result.border).toBe('#38bdf8');
      expect(result.locale).toBe('en');
    });

    it('should reject invalid XSS colors or invalid gradients', () => {
      const query = {
        bg: 'red"><script>alert(1)</script>',
        bg_gradient: 'linear-gradient(90deg, red, blue)<script>'
      };

      const result = extractThemeOverrides(query);
      expect(result.bg).toBeUndefined();
      expect(result.bgGradient).toBeUndefined();
    });

    it('should support Spanish and English locale aliases', () => {
      expect(extractThemeOverrides({ locale: 'ES' }).locale).toBe('es');
      expect(extractThemeOverrides({ lang: 'EN' }).locale).toBe('en');
      expect(extractThemeOverrides({ locale: 'fr' }).locale).toBeUndefined();
    });
  });

  describe('extractCardWidth', () => {
    it('should return 100% when full_width is true or 1', () => {
      expect(extractCardWidth({ full_width: 'true' })).toBe('100%');
      expect(extractCardWidth({ full_width: '1' })).toBe('100%');
    });

    it('should parse valid card_width or width values', () => {
      expect(extractCardWidth({ width: '450px' })).toBe('450px');
      expect(extractCardWidth({ card_width: '80%' })).toBe('80%');
      expect(extractCardWidth({ width: '600' })).toBe('600');
    });

    it('should reject invalid or malicious width parameters', () => {
      expect(extractCardWidth({ width: '450px; background: red' })).toBeUndefined();
      expect(extractCardWidth({ width: 'onload="alert(1)"' })).toBeUndefined();
    });
  });
});
