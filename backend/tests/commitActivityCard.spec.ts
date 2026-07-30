import { describe, it, expect } from 'vitest';
import { renderCommitActivityCard } from '../src/adapters/presenters/commitActivityCard';

describe('renderCommitActivityCard', () => {
  it('should render a valid SVG string for commit activity card', () => {
    const svg = renderCommitActivityCard({ username: 'testuser' }, { theme: 'dark' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('Matriz de Hábitos de Commit');
    expect(svg).toContain('github.com/testuser');
  });

  it('should classify as Night Owl when most commits occur at night', () => {
    // 7 days x 24 hours matrix, night hours (18-23, 0-3) filled
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
    matrix[0][20] = 10;
    matrix[1][22] = 15;

    const svg = renderCommitActivityCard({ username: 'nightowl', hourlyMatrix: matrix });
    expect(svg).toContain('🦉 Búho Nocturno');
  });

  it('should classify as Early Bird when most commits occur during daytime', () => {
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
    matrix[0][9] = 20;
    matrix[2][14] = 15;

    const svg = renderCommitActivityCard({ username: 'earlybird', hourlyMatrix: matrix });
    expect(svg).toContain('🌅 Madrugador');
  });

  it('should support English locale', () => {
    const svg = renderCommitActivityCard({ username: 'octocat' }, { locale: 'en' });
    expect(svg).toContain('Commit Activity Matrix');
    expect(svg).toContain('Mon');
  });
});
