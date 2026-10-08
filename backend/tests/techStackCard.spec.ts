import { describe, it, expect } from 'vitest';
import { renderTechStackCard } from '@/adapters/presenters/techStackCard';
import { THEMES } from '@/adapters/presenters/theme';

describe('techStackCard.ts', () => {
  it('should render a valid SVG tech stack card with default technologies', () => {
    const svg = renderTechStackCard('octocat', []);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('Tech Stack');
    expect(svg).toContain('TypeScript');
    expect(svg).toContain('Node.js');
    expect(svg).toContain('github.com/octocat');
  });

  it('should render custom tech stack list and custom title', () => {
    const stack = ['Rust', 'Go', 'Docker', 'Kubernetes', 'AWS', 'Python'];
    const overrides = {
      title: 'DevOps & Backend Stack',
      font: 'JetBrains Mono',
      theme: 'dracula'
    };

    const svg = renderTechStackCard('octocat', stack, 'dracula', overrides);

    expect(svg).toContain('DevOps &amp; Backend Stack');
    expect(svg).toContain('Rust');
    expect(svg).toContain('Docker');
    expect(svg).toContain('Kubernetes');
    expect(svg).toContain('JetBrains Mono');
    expect(svg).toContain(`fill="${THEMES.dracula.bg}"`);
  });

  it('should support compact layout mode', () => {
    const stack = ['TypeScript', 'React', 'Node.js'];
    const svg = renderTechStackCard('octocat', stack, 'dark', { layout: 'compact' });

    expect(svg).toContain('height="130"');
    expect(svg).toContain('TypeScript');
  });
});
