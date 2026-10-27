import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderRepoViewsCard } from '@/adapters/presenters/repoViewsCard';
import { RecordRepoViewUseCase } from '@/use-cases/metrics/RecordRepoViewUseCase';
import { GetRepoViewsCardUseCase } from '@/use-cases/cards/GetRepoViewsCardUseCase';
import { RepoStats } from '@/domain/entities/RepoStats';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';

describe('RepoViewsCard Presenter & Use Cases', () => {
  const sampleRepo: RepoStats = {
    name: 'gitcard-studio',
    owner: 'creativecodeco',
    description: 'High-performance SVG stats cards & badges for GitHub repositories.',
    stars: 128,
    forks: 24,
    language: 'TypeScript',
    languageColor: '#3178c6',
    license: 'MIT',
    url: 'https://github.com/creativecodeco/gitcard-studio'
  };

  it('should render valid SVG for repoViewsCard with localized text', () => {
    const svgEs = renderRepoViewsCard(sampleRepo, 1450, 'dark', undefined, 'es');
    expect(svgEs).toContain('<svg');
    expect(svgEs).toContain('gitcard-studio');
    expect(svgEs).toContain('creativecodeco');
    expect(svgEs).toContain('Visitas del Proyecto');
    expect(svgEs).toContain((1450).toLocaleString());

    const svgEn = renderRepoViewsCard(sampleRepo, 250, 'neon', undefined, 'en', 'Custom Hits');
    expect(svgEn).toContain('Custom Hits');
    expect(svgEn).toContain('250');
  });

  it('should escape XML characters in repo properties and custom labels', () => {
    const unsafeRepo: RepoStats = {
      ...sampleRepo,
      name: 'repo<script>',
      owner: 'owner&co',
      description: 'desc "quoted" <tag>'
    };
    const svg = renderRepoViewsCard(unsafeRepo, 5, 'dark', undefined, 'es', 'Views <img/>');
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('<img/>');
    expect(svg).toContain('repo&lt;script&gt;');
  });

  describe('RecordRepoViewUseCase', () => {
    let mockMetricsRepo: IMetricsRepository;
    let useCase: RecordRepoViewUseCase;

    beforeEach(() => {
      mockMetricsRepo = {
        recordHit: vi.fn(),
        getMetrics: vi.fn(),
        getUserMetrics: vi.fn(),
        getAllUserMetrics: vi.fn(),
        getUniqueUsersCount: vi.fn(),
        getOrIncrementProfileViews: vi.fn(),
        getOrIncrementRepoViews: vi.fn().mockResolvedValue(77),
        getRendersHistory: vi.fn(),
        updateUserReadmeVerification: vi.fn(),
        getBreakdownMetrics: vi.fn()
      };
      useCase = new RecordRepoViewUseCase(mockMetricsRepo);
    });

    it('should increment repo views when isPreview is false', async () => {
      const count = await useCase.execute(
        'octocat',
        'hello-world',
        'GitHub-Camo/1.0',
        undefined,
        false
      );
      expect(count).toBe(77);
      expect(mockMetricsRepo.getOrIncrementRepoViews).toHaveBeenCalledWith(
        'octocat',
        'hello-world',
        true,
        expect.objectContaining({ username: 'octocat' })
      );
    });

    it('should not increment repo views when isPreview is true', async () => {
      const count = await useCase.execute('octocat', 'hello-world', 'Mozilla/5.0', undefined, true);
      expect(count).toBe(77);
      expect(mockMetricsRepo.getOrIncrementRepoViews).toHaveBeenCalledWith(
        'octocat',
        'hello-world',
        false,
        expect.objectContaining({ username: 'octocat' })
      );
    });

    it('should accept owner/repo format and normalize the stored repo name', async () => {
      const count = await useCase.execute(
        'joaltoroc',
        'creativecodeco/ui',
        'GitHub-Camo/1.0',
        undefined,
        false
      );
      expect(count).toBe(77);
      expect(mockMetricsRepo.getOrIncrementRepoViews).toHaveBeenCalledWith(
        'joaltoroc',
        'ui',
        true,
        expect.objectContaining({ username: 'joaltoroc' })
      );
    });

    it('should reject invalid username or repo name', async () => {
      await expect(useCase.execute('bad user!', 'hello-world')).rejects.toThrow();
      await expect(useCase.execute('octocat', 'bad/repo!')).rejects.toThrow();
      await expect(useCase.execute('octocat', 'a/b/c')).rejects.toThrow();
    });
  });

  describe('GetRepoViewsCardUseCase', () => {
    it('should fetch featured repo and increment repo views count', async () => {
      const mockGithubRepo = {
        getFeaturedRepo: vi.fn().mockResolvedValue(sampleRepo)
      };
      const mockTokenRepo = {
        getToken: vi.fn().mockResolvedValue(null)
      };
      const mockMetricsRepo = {
        getOrIncrementRepoViews: vi.fn().mockResolvedValue(321)
      };

      const useCase = new GetRepoViewsCardUseCase(
        mockGithubRepo as never,
        mockTokenRepo as never,
        mockMetricsRepo as never
      );

      const svg = await useCase.execute(
        'creativecodeco',
        'gitcard-studio',
        'dark',
        {},
        { username: 'creativecodeco', isPreview: false, locale: 'en' }
      );

      expect(mockGithubRepo.getFeaturedRepo).toHaveBeenCalledWith(
        'creativecodeco',
        'gitcard-studio',
        undefined
      );
      expect(mockMetricsRepo.getOrIncrementRepoViews).toHaveBeenCalledWith(
        'creativecodeco',
        'gitcard-studio',
        true,
        expect.objectContaining({ username: 'creativecodeco', isPreview: false })
      );
      expect(svg).toContain('321');
      expect(svg).toContain('Project Views');
    });
  });
});
