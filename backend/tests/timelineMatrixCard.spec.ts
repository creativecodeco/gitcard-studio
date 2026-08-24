import { describe, it, expect } from 'vitest';
import { renderTimelineMatrixCard } from '@/adapters/presenters/timelineMatrixCard';

describe('Timeline Matrix Card Presenter', () => {
  it('should render timeline matrix SVG card correctly', () => {
    const svg = renderTimelineMatrixCard({ username: 'octocat' }, { theme: 'dark' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('Línea de Tiempo de Productividad');
    expect(svg).toContain('Mañana');
    expect(svg).toContain('Tarde');
  });

  it('should render in English when locale=en', () => {
    const svg = renderTimelineMatrixCard(
      { username: 'octocat' },
      { locale: 'en', theme: 'cyberpunk' }
    );
    expect(svg).toContain('Coding Productivity Timeline');
    expect(svg).toContain('Morning');
    expect(svg).toContain('Evening');
  });
});
