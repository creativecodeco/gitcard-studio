import { UserStats } from '../entities/UserStats';
import { LanguageStat } from '../entities/LanguageStat';
import { RepoStats } from '../entities/RepoStats';
import { StreakStats } from '../entities/StreakStats';
import { SponsorStats } from '../entities/SponsorStats';

export interface IGitHubRepository {
  getUserStats(username: string, userToken?: string): Promise<UserStats>;
  getUserLanguages(username: string, userToken?: string): Promise<LanguageStat[]>;
  getFeaturedRepo(username: string, repoName?: string, userToken?: string): Promise<RepoStats>;
  getUserTopRepos(username: string, limit?: number, userToken?: string): Promise<RepoStats[]>;
  getUserStreak(username: string, userToken?: string): Promise<StreakStats>;
  getUserSponsors(username: string, userToken?: string): Promise<SponsorStats>;
  getUserCommitActivity(username: string, userToken?: string): Promise<{ username: string; totalCommitsThisYear: number; hourlyMatrix: number[][] }>;
  clearCache(username: string): void;
}
