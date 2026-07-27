import { describe, it, expect } from 'vitest';
import { renderSponsorsCard } from '@/adapters/presenters/sponsorsCard';
import { SponsorStats } from '@/domain/entities/SponsorStats';
import { THEMES } from '@/adapters/presenters/theme';

const mockSponsorsStats: SponsorStats = {
  username: 'creativecode',
  name: 'Creative Code',
  avatarUrl: 'https://github.com/creativecode.png',
  totalSponsorsCount: 3,
  totalMonthlyEstimatedDollars: 45,
  monthlySponsorsCount: 2,
  oneTimeSponsorsCount: 1,
  sponsorsGivenCount: 0,
  sponsors: [
    {
      login: 'sponsor1',
      name: 'Sponsor One',
      avatarUrl: 'https://github.com/sponsor1.png',
      monthlyPriceInDollars: 20,
      isOneTime: false,
      tierName: '$20 a month',
      createdAt: '2026-01-01'
    },
    {
      login: 'sponsor2',
      name: 'Sponsor Two',
      avatarUrl: 'https://github.com/sponsor2.png',
      monthlyPriceInDollars: 25,
      isOneTime: false,
      tierName: '$25 a month',
      createdAt: '2026-02-01'
    },
    {
      login: 'sponsor3',
      name: 'Sponsor Three',
      avatarUrl: 'https://github.com/sponsor3.png',
      monthlyPriceInDollars: 50,
      isOneTime: true,
      tierName: '$50 one time',
      createdAt: '2026-03-01'
    }
  ]
};

const emptySponsorsStats: SponsorStats = {
  username: 'nosponsorsuser',
  name: 'No Sponsors User',
  avatarUrl: 'https://github.com/nosponsorsuser.png',
  totalSponsorsCount: 0,
  totalMonthlyEstimatedDollars: 0,
  monthlySponsorsCount: 0,
  oneTimeSponsorsCount: 0,
  sponsorsGivenCount: 0,
  sponsors: []
};

describe('sponsorsCard presenter', () => {
  it('should render valid SVG with correct structure and stats', async () => {
    const svg = await renderSponsorsCard(mockSponsorsStats, 'dark');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('Creative Code');
    expect(svg).toContain('@creativecode');
    expect(svg).toContain('$45');
    expect(svg).toContain('Sponsors de GitHub');
  });

  it('should contain sponsor names in output', async () => {
    const svg = await renderSponsorsCard(mockSponsorsStats, 'dark');
    expect(svg).toContain('Sponsor One');
    expect(svg).toContain('Sponsor Two');
  });

  it('should render graceful fallback when there are no sponsors', async () => {
    const svg = await renderSponsorsCard(emptySponsorsStats, 'dark');
    expect(svg).toContain('<svg');
    expect(svg).toContain('Aún sin sponsors públicos');
    expect(svg).toContain('https://github.com/sponsors/nosponsorsuser');
  });

  it('should support english locale', async () => {
    const svg = await renderSponsorsCard(emptySponsorsStats, 'dark', { locale: 'en' });
    expect(svg).toContain('No public sponsors yet');
    expect(svg).toContain('GitHub Sponsors');
  });

  it('should apply theme colors', async () => {
    const svgDark = await renderSponsorsCard(mockSponsorsStats, 'dark');
    const svgNord = await renderSponsorsCard(mockSponsorsStats, 'nord');
    expect(svgDark).toContain(THEMES.dark.bg);
    expect(svgNord).toContain(THEMES.nord.bg);
  });

  it('should support cardWidth override', async () => {
    const svg = await renderSponsorsCard(mockSponsorsStats, 'dark', { cardWidth: '100%' });
    expect(svg).toContain('width="100%"');
    expect(svg).toContain('viewBox="0 0 495 220"');
  });
});
