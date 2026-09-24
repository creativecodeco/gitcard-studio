import { Metrics, HitContext } from '../entities/Metrics';

export interface IMetricsRepository {
  recordHit(
    type:
      | 'stats'
      | 'languages'
      | 'repo'
      | 'rank'
      | 'streak'
      | 'trophies'
      | 'views'
      | 'sponsors'
      | 'commit-activity',
    context?: HitContext
  ): void;
  getMetrics(): Promise<Metrics>;
  getUserMetrics(username: string): Promise<any>;
  getAllUserMetrics(): Promise<any[]>;
  getUniqueUsersCount(): Promise<number>;
  getOrIncrementProfileViews(
    username: string,
    increment: boolean,
    context?: HitContext
  ): Promise<number>;
  getRendersHistory(days: number): Promise<any[]>;
  updateUserReadmeVerification(
    username: string,
    isVerified: boolean,
    detectedCards?: string[]
  ): Promise<void>;
  getBreakdownMetrics(): Promise<{
    formats: Array<{ format: string; count: number }>;
    themes: Array<{ theme: string; count: number }>;
    locales: Array<{ locale: string; count: number }>;
  }>;
}
