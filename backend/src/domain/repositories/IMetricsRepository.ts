import { Metrics, HitContext } from '../entities/Metrics';

export interface IMetricsRepository {
  recordHit(
    type: 'stats' | 'languages' | 'repo' | 'rank' | 'streak' | 'trophies' | 'views' | 'sponsors',
    context?: HitContext
  ): void;
  getMetrics(): Promise<Metrics>;
  getUserMetrics(username: string): Promise<any>;
  getAllUserMetrics(): Promise<any[]>;
  getUniqueUsersCount(): Promise<number>;
  getOrIncrementProfileViews(username: string, increment: boolean, context?: HitContext): Promise<number>;
  getRendersHistory(days: number): Promise<any[]>;
}
