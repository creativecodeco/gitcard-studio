import { describe, it, expect } from 'vitest';
import { getTheme, renderBrandHeader, THEMES } from '../src/adapters/presenters/theme';

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
      expect(renderBrandHeader('https://github.com/octocat/repo')).toContain('github.com/octocat/repo');
    });

    it('should XML escape target names to prevent XSS injection', () => {
      const svg = renderBrandHeader('octocat<script>');
      expect(svg).toContain('github.com/octocat&lt;script&gt;');
      expect(svg).not.toContain('<script>');
    });
  });
});
