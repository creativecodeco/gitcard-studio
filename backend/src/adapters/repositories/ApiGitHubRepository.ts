import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { UserStats } from '@/domain/entities/UserStats';
import { LanguageStat } from '@/domain/entities/LanguageStat';
import { RepoStats } from '@/domain/entities/RepoStats';
import { StreakStats } from '@/domain/entities/StreakStats';
import { SponsorStats, SponsorItem } from '@/domain/entities/SponsorStats';
import { logger } from '@/infrastructure/logging/logger';

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Java: '#b07219',
  Go: '#00add8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  React: '#61dafb',
  Svelte: '#ff3e00',
  Dart: '#00b4ab',
  Objective_C: '#438eff',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  PowerShell: '#012456',
  R: '#198ce7'
};

const DEFAULT_COLOR = '#858585';

export class ApiGitHubRepository implements IGitHubRepository {
  private getHeaders(userToken?: string): HeadersInit {
    const headers: HeadersInit = {
      'User-Agent': 'github-helpers-stats',
      Accept: 'application/vnd.github.v3+json'
    };

    const token = userToken || process.env.GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    return headers;
  }

  private async fetchGitHub(
    url: string,
    userToken?: string,
    extraHeaders: Record<string, string> = {}
  ): Promise<any> {
    if (!url.startsWith('https://api.github.com/')) {
      throw new Error('Forbidden URL target: Only GitHub API requests are allowed.');
    }
    const mergedHeaders = { ...this.getHeaders(userToken), ...extraHeaders };
    const response = await fetch(url, { headers: mergedHeaders });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error (${response.status}) for URL ${url}: ${errorText}`);
    }

    return response.json();
  }

  private async fetchRepoStats(
    username: string,
    userToken?: string
  ): Promise<{ totalStars: number; forksReceived: number }> {
    let totalStars = 0;
    let forksReceived = 0;
    let page = 1;
    let hasMoreRepos = true;

    while (hasMoreRepos && page <= 3) {
      const reposUrl = userToken
        ? `https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner,collaborator,organization_member`
        : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`;

      const repos = await this.fetchGitHub(reposUrl, userToken);
      if (repos.length === 0) {
        hasMoreRepos = false;
      } else {
        for (const repo of repos) {
          if (!repo.fork) {
            totalStars += repo.stargazers_count || 0;
            forksReceived += repo.forks_count || 0;
          }
        }
        page++;
      }
    }

    return { totalStars, forksReceived };
  }

  private async fetchTotalCount(
    url: string,
    userToken?: string,
    headers: Record<string, string> = {}
  ): Promise<number> {
    try {
      const searchResult = await this.fetchGitHub(url, userToken, headers);
      return searchResult.total_count || 0;
    } catch (e) {
      logger.warn(`Could not fetch search count for ${url}`, { url, error: e });
      return 0;
    }
  }

  private calculateDeveloperRank(score: number): string {
    if (score > 10000) return 'S+';
    if (score > 5000) return 'S';
    if (score > 2000) return 'A+';
    if (score > 1000) return 'A';
    if (score > 500) return 'B+';
    if (score > 200) return 'B';
    return 'C';
  }

  private async fetchGraphQL<T = any>(
    query: string,
    variables: Record<string, unknown>,
    userToken?: string
  ): Promise<T | null> {
    const token = userToken || process.env.GITHUB_TOKEN;
    if (!token) return null;

    try {
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'User-Agent': 'github-helpers-stats',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query, variables })
      });

      if (!response.ok) return null;

      const result = await response.json();
      if (result.errors || !result.data) return null;

      return result.data as T;
    } catch {
      return null;
    }
  }

  private async getUserStatsViaGraphQL(
    username: string,
    userToken?: string
  ): Promise<UserStats | null> {
    const isViewer = Boolean(userToken);
    const query = isViewer
      ? `
        query GetViewerStats($after: String) {
          viewer {
            login
            name
            avatarUrl
            followers { totalCount }
            repositories(first: 100, after: $after, affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER], ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER], isFork: false) {
              totalCount
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                stargazerCount
                forkCount
              }
            }
            contributionsCollection {
              totalCommitContributions
              totalPullRequestContributions
              totalIssueContributions
              restrictedContributionsCount
            }
          }
        }
      `
      : `
        query GetUserStats($username: String!, $after: String) {
          user(login: $username) {
            login
            name
            avatarUrl
            followers { totalCount }
            repositories(first: 100, after: $after, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER], isFork: false, privacy: PUBLIC) {
              totalCount
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                stargazerCount
                forkCount
              }
            }
            contributionsCollection {
              totalCommitContributions
              totalPullRequestContributions
              totalIssueContributions
              restrictedContributionsCount
            }
          }
        }
      `;

    let hasNextPage = true;
    let afterCursor: string | null = null;
    let pagesFetched = 0;
    const MAX_PAGES = 3;

    let targetUser: any = null;
    const allRepoNodes: any[] = [];
    let totalPublicReposCount = 0;

    while (hasNextPage && pagesFetched < MAX_PAGES) {
      const variables: Record<string, unknown> = isViewer
        ? { after: afterCursor }
        : { username, after: afterCursor };

      const data: { user?: any; viewer?: any } | null = await this.fetchGraphQL<{ user?: any; viewer?: any }>(
        query,
        variables,
        userToken
      );

      const currentUser: any = isViewer ? data?.viewer : data?.user;
      if (!currentUser) break;
      if (!targetUser) targetUser = currentUser;

      const reposData: any = currentUser.repositories;
      if (reposData) {
        if (totalPublicReposCount === 0) {
          totalPublicReposCount = reposData.totalCount || 0;
        }
        allRepoNodes.push(...(reposData.nodes ?? []));
        hasNextPage = reposData.pageInfo?.hasNextPage ?? false;
        afterCursor = reposData.pageInfo?.endCursor ?? null;
      } else {
        hasNextPage = false;
      }
      pagesFetched++;
    }

    if (!targetUser) return null;

    const u = targetUser;
    let totalStars = 0;
    let forksReceived = 0;

    for (const r of allRepoNodes) {
      totalStars += r.stargazerCount ?? 0;
      forksReceived += r.forkCount ?? 0;
    }

    const cc = u.contributionsCollection ?? {};
    const totalCommits =
      (cc.totalCommitContributions ?? 0) + (cc.restrictedContributionsCount ?? 0);
    const totalPRs = cc.totalPullRequestContributions ?? 0;
    const totalIssues = cc.totalIssueContributions ?? 0;
    const followers = u.followers?.totalCount ?? 0;

    const score =
      totalCommits * 1 + totalPRs * 3 + totalIssues * 1 + totalStars * 5 + followers * 8;

    const rank = this.calculateDeveloperRank(score);
    const collaborationIndex = Math.min(
      100,
      Math.round(((totalPRs + totalIssues) / (totalCommits + totalPRs + totalIssues + 1)) * 100)
    );

    return {
      username: u.login,
      name: u.name || u.login,
      avatarUrl: u.avatarUrl,
      followers,
      publicRepos: totalPublicReposCount,
      totalStars,
      totalCommits,
      totalPRs,
      totalIssues,
      forksReceived,
      rank,
      collaborationIndex
    };
  }

  async getUserStats(username: string, userToken?: string): Promise<UserStats> {
    const gqlStats = await this.getUserStatsViaGraphQL(username, userToken);
    if (gqlStats) return gqlStats;

    const userProfile = userToken
      ? await this.fetchGitHub('https://api.github.com/user', userToken)
      : await this.fetchGitHub(`https://api.github.com/users/${username}`);

    const { totalStars, forksReceived } = await this.fetchRepoStats(username, userToken);

    const totalCommits = await this.fetchTotalCount(
      `https://api.github.com/search/commits?q=author:${username}`,
      userToken,
      { Accept: 'application/vnd.github.cloak-preview+json' }
    );

    const totalPRs = await this.fetchTotalCount(
      `https://api.github.com/search/issues?q=author:${username}+type:pr`,
      userToken
    );

    const totalIssues = await this.fetchTotalCount(
      `https://api.github.com/search/issues?q=author:${username}+type:issue`,
      userToken
    );

    const score =
      totalCommits * 1 +
      totalPRs * 3 +
      totalIssues * 1 +
      totalStars * 5 +
      (userProfile.followers || 0) * 8;

    const rank = this.calculateDeveloperRank(score);

    const collaborationIndex = Math.min(
      100,
      Math.round(((totalPRs + totalIssues) / (totalCommits + totalPRs + totalIssues + 1)) * 100)
    );

    return {
      username: userProfile.login,
      name: userProfile.name || userProfile.login,
      avatarUrl: userProfile.avatar_url,
      followers: userProfile.followers || 0,
      publicRepos: userProfile.public_repos || 0,
      totalStars,
      totalCommits,
      totalPRs,
      totalIssues,
      forksReceived,
      rank,
      collaborationIndex
    };
  }

  private async fetchNonForkRepos(username: string, userToken?: string): Promise<any[]> {
    const nonForkRepos: any[] = [];
    let page = 1;
    let hasMoreRepos = true;

    while (hasMoreRepos && page <= 5) {
      const reposUrl = userToken
        ? `https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner,collaborator,organization_member`
        : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`;

      const repos = await this.fetchGitHub(reposUrl, userToken);
      if (repos.length === 0) {
        hasMoreRepos = false;
      } else {
        for (const repo of repos) {
          if (!repo.fork) {
            nonForkRepos.push(repo);
          }
        }
        page++;
      }
    }

    return nonForkRepos;
  }

  private async aggregateRepoLanguages(
    repos: any[],
    username: string,
    userToken?: string
  ): Promise<Record<string, { count: number; size: number }>> {
    const languageMap: Record<string, { count: number; size: number }> = Object.create(null);
    const CONCURRENCY_LIMIT = 15;

    for (let i = 0; i < repos.length; i += CONCURRENCY_LIMIT) {
      const batch = repos.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.all(
        batch.map(async (repo) => {
          try {
            const ownerLogin = repo.owner?.login || username;
            const repoLangs = await this.fetchGitHub(
              `https://api.github.com/repos/${ownerLogin}/${repo.name}/languages`,
              userToken
            );
            for (const [lang, bytes] of Object.entries(repoLangs)) {
              if (!lang || lang === '__proto__' || lang === 'constructor' || lang === 'prototype') {
                continue;
              }
              const sizeInKB = (bytes as number) / 1024;
              if (!Object.hasOwn(languageMap, lang)) {
                languageMap[lang] = { count: 0, size: 0 };
              }
              languageMap[lang].count += 1;
              languageMap[lang].size += sizeInKB;
            }
          } catch (err) {
            logger.warn(`Could not fetch languages for repo ${username}/${repo.name}`, {
              username,
              repo: repo.name,
              error: err
            });
          }
        })
      );
    }

    return languageMap;
  }

  private async getUserLanguagesViaGraphQL(
    username: string,
    userToken?: string
  ): Promise<LanguageStat[] | null> {
    const isViewer = Boolean(userToken);
    const query = isViewer
      ? `
        query GetViewerLanguages {
          viewer {
            repositories(first: 100, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER], isFork: false) {
              nodes {
                languages(first: 10) {
                  edges {
                    size
                    node {
                      name
                      color
                    }
                  }
                }
              }
            }
          }
        }
      `
      : `
        query GetUserLanguages($username: String!) {
          user(login: $username) {
            repositories(first: 100, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER], isFork: false, privacy: PUBLIC) {
              nodes {
                languages(first: 10) {
                  edges {
                    size
                    node {
                      name
                      color
                    }
                  }
                }
              }
            }
          }
        }
      `;

    const data = await this.fetchGraphQL<{ user?: any; viewer?: any }>(
      query,
      isViewer ? {} : { username },
      userToken
    );
    const targetUser = isViewer ? data?.viewer : data?.user;
    if (!targetUser) return null;

    const repos = targetUser.repositories?.nodes ?? [];
    const languageMap: Record<string, { count: number; size: number; color?: string }> =
      Object.create(null);

    for (const r of repos) {
      const edges = r.languages?.edges ?? [];
      for (const edge of edges) {
        const langName = edge.node?.name;
        if (
          !langName ||
          langName === '__proto__' ||
          langName === 'constructor' ||
          langName === 'prototype'
        ) {
          continue;
        }
        const sizeInKB = (edge.size ?? 0) / 1024;
        if (!Object.hasOwn(languageMap, langName)) {
          languageMap[langName] = {
            count: 0,
            size: 0,
            color: edge.node?.color ?? LANGUAGE_COLORS[langName] ?? DEFAULT_COLOR
          };
        }
        languageMap[langName].count += 1;
        languageMap[langName].size += sizeInKB;
      }
    }

    return this.buildLanguageStats(languageMap);
  }

  private buildLanguageStats(
    languageMap: Record<string, { count: number; size: number; color?: string }>
  ): LanguageStat[] {
    const statsArray: LanguageStat[] = [];
    let totalSize = 0;

    for (const [name, info] of Object.entries(languageMap)) {
      totalSize += info.size;
      statsArray.push({
        name,
        count: info.count,
        size: info.size,
        percentage: 0,
        color: info.color ?? LANGUAGE_COLORS[name] ?? DEFAULT_COLOR
      });
    }

    statsArray.sort((a, b) => b.size - a.size);

    const result = statsArray.map((stat) => ({
      ...stat,
      percentage: totalSize > 0 ? Number.parseFloat(((stat.size / totalSize) * 100).toFixed(1)) : 0
    }));

    const topLanguages = result.slice(0, 6);
    if (result.length > 6) {
      const otherLanguages = result.slice(6);
      const otherSize = otherLanguages.reduce((sum, item) => sum + item.size, 0);
      const otherCount = otherLanguages.reduce((sum, item) => sum + item.count, 0);
      const otherPercentage = Number.parseFloat(((otherSize / totalSize) * 100).toFixed(1));

      if (otherSize > 0 && otherPercentage > 0) {
        topLanguages.push({
          name: 'Otros',
          count: otherCount,
          size: otherSize,
          percentage: otherPercentage,
          color: DEFAULT_COLOR
        });
      }
    }

    return topLanguages;
  }

  async getUserLanguages(username: string, userToken?: string): Promise<LanguageStat[]> {
    if (!userToken) {
      const gqlLangs = await this.getUserLanguagesViaGraphQL(username, userToken);
      if (gqlLangs && gqlLangs.length > 0) return gqlLangs;
    }

    const repos = await this.fetchNonForkRepos(username, userToken);
    const languageMap = await this.aggregateRepoLanguages(repos, username, userToken);
    return this.buildLanguageStats(languageMap);
  }

  private updateBestRepo(repos: any[], currentBest: any): any {
    let best = currentBest;
    for (const repo of repos) {
      if (!repo.fork) {
        if (!best || (repo.stargazers_count || 0) > (best.stargazers_count || 0)) {
          best = repo;
        }
      }
    }
    return best;
  }

  private async findBestRepo(username: string, userToken?: string): Promise<any> {
    let bestRepo: any = null;
    let page = 1;
    let hasMoreRepos = true;

    while (hasMoreRepos && page <= 3) {
      const reposUrl = userToken
        ? `https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner,collaborator,organization_member`
        : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`;

      const repos = await this.fetchGitHub(reposUrl, userToken);
      if (repos.length === 0) {
        hasMoreRepos = false;
      } else {
        bestRepo = this.updateBestRepo(repos, bestRepo);
        page++;
      }
    }

    if (!bestRepo) {
      throw new Error('No se encontraron repositorios (no forks) para este usuario.');
    }
    return bestRepo;
  }

  async getFeaturedRepo(
    username: string,
    repoName?: string,
    userToken?: string
  ): Promise<RepoStats> {
    const repoData = repoName
      ? await this.fetchGitHub(`https://api.github.com/repos/${username}/${repoName}`, userToken)
      : await this.findBestRepo(username, userToken);

    const name = repoData.name;
    const owner = repoData.owner.login;
    const description = repoData.description || 'Sin descripción disponible.';
    const stars = repoData.stargazers_count || 0;
    const forks = repoData.forks_count || 0;
    const language = repoData.language || 'Markdown';
    const languageColor = LANGUAGE_COLORS[language] || DEFAULT_COLOR;
    const license = repoData.license
      ? repoData.license.spdx_id || repoData.license.name
      : 'No License';

    return {
      name,
      owner,
      description,
      stars,
      forks,
      language,
      languageColor,
      license
    };
  }

  private parseContributions(html: string): { date: string; level: number }[] {
    const tdRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
    const contributions: { date: string; level: number }[] = [];

    let match: RegExpExecArray | null;
    while ((match = tdRegex.exec(html)) !== null) {
      contributions.push({ date: match[1], level: Number.parseInt(match[2], 10) });
    }

    contributions.sort((a, b) => a.date.localeCompare(b.date));
    return contributions;
  }

  private calculateStreakStats(contributions: { date: string; level: number }[]): {
    longestStreak: number;
    longestStreakStart: string;
    longestStreakEnd: string;
  } {
    let longestStreak = 0;
    let longestStreakStart = '';
    let longestStreakEnd = '';
    let streak = 0;
    let streakStart = '';

    for (const { date, level } of contributions) {
      if (level > 0) {
        if (streak === 0) streakStart = date;
        streak++;
        if (streak > longestStreak) {
          longestStreak = streak;
          longestStreakStart = streakStart;
          longestStreakEnd = date;
        }
      } else {
        streak = 0;
      }
    }

    return { longestStreak, longestStreakStart, longestStreakEnd };
  }

  private calculateCurrentStreak(
    activeDays: Set<string>,
    today: Date
  ): { currentStreak: number; currentStreakStart: string; currentStreakEnd: string } {
    function addDays(d: Date, n: number): Date {
      const copy = new Date(d);
      copy.setUTCDate(copy.getUTCDate() + n);
      return copy;
    }

    function fmt(d: Date): string {
      return d.toISOString().slice(0, 10);
    }

    const todayStr = fmt(today);
    const yesterdayStr = fmt(addDays(today, -1));

    let currentStreak = 0;
    let currentStreakStart = '';
    let currentStreakEnd = '';

    let cursor: Date | null = null;
    if (activeDays.has(todayStr)) {
      cursor = today;
    } else if (activeDays.has(yesterdayStr)) {
      cursor = addDays(today, -1);
    }

    if (cursor) {
      currentStreakEnd = fmt(cursor);
      while (activeDays.has(fmt(cursor))) {
        currentStreak++;
        currentStreakStart = fmt(cursor);
        cursor = addDays(cursor, -1);
      }
    }

    return { currentStreak, currentStreakStart, currentStreakEnd };
  }

  private async getUserStreakViaGraphQL(
    username: string,
    userToken?: string
  ): Promise<StreakStats | null> {
    const query = `
      query GetStreakStats($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.fetchGraphQL<{ user: any }>(query, { username }, userToken);
    if (!data?.user) return null;

    const cal = data.user.contributionsCollection?.contributionCalendar;
    if (!cal) return null;

    const contributions: { date: string; level: number }[] = [];
    for (const week of cal.weeks ?? []) {
      for (const day of week.contributionDays ?? []) {
        contributions.push({
          date: day.date,
          level: (day.contributionCount ?? 0) > 0 ? 1 : 0
        });
      }
    }

    if (contributions.length === 0) return null;

    const totalContributions = cal.totalContributions ?? 0;
    return this.buildStreakStats(username, contributions, totalContributions);
  }

  private buildStreakStats(
    username: string,
    contributions: { date: string; level: number }[],
    overrideTotal?: number
  ): StreakStats {
    const totalContributions = overrideTotal ?? contributions.filter((c) => c.level > 0).length;

    const firstContribEntry = contributions.find((c) => c.level > 0);
    const firstContributionDate = firstContribEntry
      ? firstContribEntry.date
      : contributions[0].date;

    const activeDays = new Set(contributions.filter((c) => c.level > 0).map((c) => c.date));
    const { longestStreak, longestStreakStart, longestStreakEnd } =
      this.calculateStreakStats(contributions);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { currentStreak, currentStreakStart, currentStreakEnd } = this.calculateCurrentStreak(
      activeDays,
      today
    );

    return {
      username,
      totalContributions,
      currentStreak,
      longestStreak,
      currentStreakStart,
      currentStreakEnd,
      longestStreakStart,
      longestStreakEnd,
      firstContributionDate
    };
  }

  async getUserStreak(username: string, userToken?: string): Promise<StreakStats> {
    const gqlStreak = await this.getUserStreakViaGraphQL(username, userToken);
    if (gqlStreak) return gqlStreak;

    if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
      throw new Error('Invalid username format');
    }
    const url = `https://github.com/users/${username}/contributions`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'github-helpers-stats',
        Accept: 'text/html'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub contributions page error (${response.status}) for user: ${username}`);
    }

    const html = await response.text();
    const contributions = this.parseContributions(html);

    if (contributions.length === 0) {
      throw new Error(`No contribution data found for user: ${username}`);
    }

    return this.buildStreakStats(username, contributions);
  }

  clearCache(_username: string): void {
    // No-op for the raw API client
  }

  private async getUserTopReposViaGraphQL(
    username: string,
    limit: number = 4,
    userToken?: string
  ): Promise<RepoStats[] | null> {
    const query = `
      query GetUserTopRepos($username: String!) {
        user(login: $username) {
          repositories(first: 100, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER], isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
            nodes {
              name
              description
              stargazerCount
              forkCount
              owner { login }
              primaryLanguage {
                name
                color
              }
              licenseInfo {
                name
                spdxId
              }
            }
          }
        }
      }
    `;

    const data = await this.fetchGraphQL<{ user: any }>(query, { username }, userToken);
    if (!data?.user) return null;

    const repos = data.user.repositories?.nodes ?? [];
    const topRepos = repos.slice(0, limit);

    return topRepos.map((r: any) => {
      const langName = r.primaryLanguage?.name ?? 'Markdown';
      return {
        name: r.name,
        owner: r.owner?.login ?? username,
        description: r.description ?? 'Sin descripción disponible.',
        stars: r.stargazerCount ?? 0,
        forks: r.forkCount ?? 0,
        language: langName,
        languageColor: r.primaryLanguage?.color ?? LANGUAGE_COLORS[langName] ?? DEFAULT_COLOR,
        license: r.licenseInfo?.spdxId ?? r.licenseInfo?.name ?? 'No License'
      };
    });
  }

  async getUserTopRepos(
    username: string,
    limit: number = 4,
    userToken?: string
  ): Promise<RepoStats[]> {
    const gqlTopRepos = await this.getUserTopReposViaGraphQL(username, limit, userToken);
    if (gqlTopRepos && gqlTopRepos.length > 0) return gqlTopRepos;

    const reposUrl = userToken
      ? `https://api.github.com/user/repos?per_page=100&sort=stars&direction=desc`
      : `https://api.github.com/users/${username}/repos?per_page=100&sort=stars&direction=desc`;

    const repos = await this.fetchGitHub(reposUrl, userToken);

    const sorted = (repos as any[])
      .filter((r: any) => !r.fork)
      .sort((a: any, b: any) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, limit);

    return sorted.map((repo: any) => {
      const language = repo.language || 'Markdown';
      return {
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description || 'Sin descripción disponible.',
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        language,
        languageColor: LANGUAGE_COLORS[language] || DEFAULT_COLOR,
        license: repo.license ? repo.license.spdx_id || repo.license.name : 'No License'
      };
    });
  }

  private async getUserSponsorsViaGraphQL(
    username: string,
    userToken?: string
  ): Promise<SponsorStats | null> {
    const query = `
      query GetSponsors($username: String!) {
        user(login: $username) {
          login
          name
          avatarUrl
          sponsorshipsAsMaintainer(first: 100, activeOnly: true) {
            totalCount
            nodes {
              sponsorEntity {
                ... on User {
                  login
                  name
                  avatarUrl
                }
                ... on Organization {
                  login
                  name
                  avatarUrl
                }
              }
              tier {
                name
                monthlyPriceInCents
                monthlyPriceInDollars
                isOneTime
              }
              createdAt
            }
          }
          sponsorshipsAsSponsor(first: 10) {
            totalCount
          }
        }
        organization(login: $username) {
          login
          name
          avatarUrl
          sponsorshipsAsMaintainer(first: 100, activeOnly: true) {
            totalCount
            nodes {
              sponsorEntity {
                ... on User {
                  login
                  name
                  avatarUrl
                }
                ... on Organization {
                  login
                  name
                  avatarUrl
                }
              }
              tier {
                name
                monthlyPriceInCents
                monthlyPriceInDollars
                isOneTime
              }
              createdAt
            }
          }
        }
      }
    `;

    const data = await this.fetchGraphQL<{ user?: any; organization?: any }>(
      query,
      { username },
      userToken
    );

    const entity = data?.user || data?.organization;
    if (!entity) return null;

    const sponsorships = entity.sponsorshipsAsMaintainer;
    const totalSponsorsCount = sponsorships?.totalCount ?? 0;
    const rawNodes = sponsorships?.nodes ?? [];
    const sponsorsGivenCount = data?.user?.sponsorshipsAsSponsor?.totalCount ?? 0;

    let monthlySponsorsCount = 0;
    let oneTimeSponsorsCount = 0;
    let totalMonthlyEstimatedDollars = 0;

    const sponsors: SponsorItem[] = [];

    for (const node of rawNodes) {
      if (!node) continue;
      const sponsorEntity = node.sponsorEntity;
      if (!sponsorEntity) continue;

      const tier = node.tier;
      const dollars = tier?.monthlyPriceInDollars ?? Math.round((tier?.monthlyPriceInCents ?? 0) / 100);
      const isOneTime = Boolean(tier?.isOneTime);

      if (isOneTime) {
        oneTimeSponsorsCount++;
      } else {
        monthlySponsorsCount++;
        totalMonthlyEstimatedDollars += dollars;
      }

      sponsors.push({
        login: sponsorEntity.login ?? '',
        name: sponsorEntity.name || sponsorEntity.login || '',
        avatarUrl: sponsorEntity.avatarUrl ?? '',
        monthlyPriceInDollars: dollars,
        isOneTime,
        tierName: tier?.name ?? '',
        createdAt: node.createdAt ?? ''
      });
    }

    return {
      username: entity.login || username,
      name: entity.name || entity.login || username,
      avatarUrl: entity.avatarUrl || `https://github.com/${username}.png`,
      totalSponsorsCount,
      totalMonthlyEstimatedDollars,
      monthlySponsorsCount,
      oneTimeSponsorsCount,
      sponsorsGivenCount,
      sponsors
    };
  }

  async getUserSponsors(username: string, userToken?: string): Promise<SponsorStats> {
    const gqlSponsors = await this.getUserSponsorsViaGraphQL(username, userToken);
    if (gqlSponsors) return gqlSponsors;

    const userProfile = userToken
      ? await this.fetchGitHub('https://api.github.com/user', userToken)
      : await this.fetchGitHub(`https://api.github.com/users/${username}`);

    return {
      username: userProfile.login || username,
      name: userProfile.name || userProfile.login || username,
      avatarUrl: userProfile.avatar_url || `https://github.com/${username}.png`,
      totalSponsorsCount: 0,
      totalMonthlyEstimatedDollars: 0,
      monthlySponsorsCount: 0,
      oneTimeSponsorsCount: 0,
      sponsorsGivenCount: 0,
      sponsors: []
    };
  }

  async getUserCommitActivity(
    username: string,
    userToken?: string
  ): Promise<{ username: string; totalCommitsThisYear: number; hourlyMatrix: number[][] }> {
    const hourlyMatrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let totalCommitsThisYear = 0;

    const query = `
      query GetCommitActivity($username: String!) {
        user(login: $username) {
          contributionsCollection {
            totalCommitContributions
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  weekday
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.fetchGraphQL<{ user: any }>(query, { username }, userToken);
      if (data?.user?.contributionsCollection) {
        const cc = data.user.contributionsCollection;
        totalCommitsThisYear = cc.totalCommitContributions ?? 0;
        const cal = cc.contributionCalendar;

        if (cal?.weeks) {
          for (const week of cal.weeks) {
            for (const day of week.contributionDays ?? []) {
              const count = day.contributionCount ?? 0;
              if (count > 0) {
                const rawDay = day.weekday ?? 0;
                const dayIdx = rawDay === 0 ? 6 : rawDay - 1;

                const dateSeed = day.date ? new Date(day.date).getDate() : 15;
                const primaryHour = (9 + (dateSeed % 12)) % 24;
                const secondaryHour = (primaryHour + 4) % 24;

                hourlyMatrix[dayIdx][primaryHour] += Math.ceil(count / 2);
                hourlyMatrix[dayIdx][secondaryHour] += Math.floor(count / 2);
              }
            }
          }
        }
      }
    } catch (err) {
      logger.warn(`Could not fetch commit activity for user ${username}:`, { username, error: err });
    }

    return {
      username,
      totalCommitsThisYear,
      hourlyMatrix
    };
  }
}
