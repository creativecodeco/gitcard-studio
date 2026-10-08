import { describe, it, expect } from 'vitest';
import {
  getTheme,
  getBackgroundDef,
  renderBrandHeader,
  renderGlowFilter,
  renderCardFrame,
  renderAnimationStyles,
  THEMES
} from '../src/adapters/presenters/theme';

describe('theme.ts', () => {
  describe('getTheme', () => {
    it('should return dark theme by default if no theme specified', () => {
      const theme = getTheme();
      expect(theme).toEqual(THEMES.dark);
    });

    it('should return requested theme case-insensitively', () => {
      const theme = getTheme('LIGHT');
      expect(theme).toEqual(THEMES.light);
    });

    it('should apply color overrides correctly', () => {
      const theme = getTheme('dark', { bg: 'ff0000', text: '#00ff00' });
      expect(theme.bg).toBe('#ff0000');
      expect(theme.text).toBe('#00ff00');
    });

    it('should support new Phase 1 themes like dracula, midnight, and retrowave', () => {
      expect(getTheme('dracula')).toEqual(THEMES.dracula);
      expect(getTheme('midnight')).toEqual(THEMES.midnight);
      expect(getTheme('retrowave')).toEqual(THEMES.retrowave);
      expect(getTheme('catppuccin_latte')).toEqual(THEMES.catppuccin_latte);
    });
  });

  describe('sanitizeGradient & getBackgroundDef', () => {
    it('should parse multi-hex comma-separated gradient strings', () => {
      const theme = getTheme('dark', { bgGradient: 'ff007f,7928ca,00f0ff' });
      expect(theme.bgGradient).toBe(
        'linear-gradient(135deg, #ff007f 0%, #7928ca 50%, #00f0ff 100%)'
      );
    });

    it('should generate background SVG def for linear-gradient with hex, rgba, and hsla colors', () => {
      const theme = {
        ...THEMES.dark,
        bgGradient:
          'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, hsla(210, 50%, 40%, 0.8) 100%)'
      };
      const def = getBackgroundDef(theme, 'custom-bg');
      expect(def).toContain('id="custom-bg"');
      expect(def).toContain('stop-color="rgba(30, 41, 59, 0.7)"');
      expect(def).toContain('stop-color="hsla(210, 50%, 40%, 0.8)"');
    });

    it('should handle adversarial long inputs without performance degradation (ReDoS prevention)', () => {
      const longInput = 'rgb(' + 'rgb('.repeat(500) + '255, 255, 255' + ')'.repeat(500);
      const theme = {
        ...THEMES.dark,
        bgGradient: `linear-gradient(90deg, ${longInput})`
      };
      const startTime = performance.now();
      const def = getBackgroundDef(theme, 'test-bg');
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(100);
      expect(def).toContain('linearGradient');
    });
  });

  describe('SVG Glow & Frame Helpers', () => {
    it('should render a valid glow filter SVG element', () => {
      const glow = renderGlowFilter('glow-test', '#00ff66');
      expect(glow).toContain('id="glow-test"');
      expect(glow).toContain('flood-color="#00ff66"');
    });

    it('should render card frame with custom border radius and stroke', () => {
      const frame = renderCardFrame({
        width: 495,
        height: 195,
        theme: THEMES.midnight,
        borderRadius: 20,
        showBorder: true
      });
      expect(frame).toContain('rx="20"');
      expect(frame).toContain('stroke="#1e293b"');
    });
  });

  describe('renderBrandHeader', () => {
    it('should render default brand header when no target is provided', () => {
      const svg = renderBrandHeader();
      expect(svg).toContain('github.com');
      expect(svg).not.toContain('github.com/github.com');
    });

    it('should handle target with leading github.com or https:// without duplication', () => {
      expect(renderBrandHeader('octocat')).toContain('github.com/octocat');
      expect(renderBrandHeader('github.com/octocat')).toContain('github.com/octocat');
      expect(renderBrandHeader('https://github.com/octocat/repo')).toContain(
        'github.com/octocat/repo'
      );
    });

    it('should XML escape target names to prevent XSS injection', () => {
      const svg = renderBrandHeader('octocat<script>');
      expect(svg).toContain('github.com/octocat&lt;script&gt;');
      expect(svg).not.toContain('<script>');
    });
  });

  describe('renderAnimationStyles', () => {
    it('should render CSS animation keyframe rules', () => {
      expect(renderAnimationStyles('pulse')).toContain('@keyframes pulseAnim');
      expect(renderAnimationStyles('fade-in')).toContain('@keyframes fadeInAnim');
      expect(renderAnimationStyles('shimmer')).toContain('@keyframes shimmerAnim');
      expect(renderAnimationStyles(undefined)).toBe('');
    });
  });
});
