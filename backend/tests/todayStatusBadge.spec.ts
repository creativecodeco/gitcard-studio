import { describe, it, expect } from 'vitest';
import { renderTodayStatusBadge } from '@/adapters/presenters/todayStatusBadge.presenter';

describe('Today Status Badge Presenter', () => {
  it('should render active state SVG when commitsToday > 0', () => {
    const svg = renderTodayStatusBadge({ username: 'octocat', commitsToday: 5 }, { theme: 'dark' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('Activo hoy');
    expect(svg).toContain('5 commits');
    expect(svg).toContain('🔥');
  });

  it('should render resting state SVG when commitsToday is 0', () => {
    const svg = renderTodayStatusBadge({ username: 'octocat', commitsToday: 0 }, { theme: 'neon' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('Descansando hoy');
    expect(svg).toContain('💤');
  });
});
