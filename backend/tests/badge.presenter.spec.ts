import { describe, it, expect } from 'vitest';
import { renderBadgeSVG } from '@/adapters/presenters/badge.presenter';

describe('Badge Presenter', () => {
  it('should render valid SVG badge with label and value', () => {
    const svg = renderBadgeSVG({
      label: 'profile views',
      value: 1250,
      valueColor: '#4ade80'
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('profile views');
    expect(svg).toContain('1250');
    expect(svg).toContain('#4ade80');
    expect(svg).toContain('</svg>');
  });

  it('should escape XML entities properly', () => {
    const svg = renderBadgeSVG({
      label: '<script>',
      value: '100% & <more>'
    });

    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('&amp;');
  });
});
