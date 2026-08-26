import { AppDataSource } from '@/infrastructure/database/database';
import { UserTokenEntity } from '@/infrastructure/database/entities/UserTokenEntity';
import { UserMetric } from '@/infrastructure/database/entities/UserMetric';
import { UserStatsHistory } from '@/infrastructure/database/entities/UserStatsHistory';
import { RequestLog } from '@/infrastructure/database/entities/RequestLog';

export interface UserDataExportResult {
  exportedAt: string;
  username: string;
  consentRecord: {
    hasRegisteredToken: boolean;
    tokenType?: string;
    scopes?: string | null;
    consentAccepted?: boolean;
    consentDate?: Date | string;
    consentFingerprint?: string;
    updatedAt?: Date | string;
  };
  metrics: UserMetric | null;
  statsHistory: Array<{
    snapshotDate: Date | string;
    stars: number;
    commits: number;
    prs: number;
    issues: number;
    followers: number;
    languages?: Record<string, number>;
  }>;
  recentActivityLogs: Array<{
    cardType?: string | null;
    source?: string | null;
    timestamp: Date | string;
  }>;
}

export class ExportUserDataUseCase {
  async execute(username: string): Promise<UserDataExportResult> {
    const tokenRepo = AppDataSource.getRepository(UserTokenEntity);
    const metricRepo = AppDataSource.getRepository(UserMetric);
    const historyRepo = AppDataSource.getRepository(UserStatsHistory);
    const logRepo = AppDataSource.getRepository(RequestLog);

    const tokenRecord = await tokenRepo.findOne({ where: { username } });
    const metrics = await metricRepo.findOne({ where: { username } });
    const history = await historyRepo.find({
      where: { username },
      order: { recorded_at: 'DESC' },
      take: 50
    });
    const logs = await logRepo.find({
      where: { username },
      order: { created_at: 'DESC' },
      take: 100
    });

    return {
      exportedAt: new Date().toISOString(),
      username,
      consentRecord: {
        hasRegisteredToken: !!tokenRecord,
        tokenType: tokenRecord?.token_type,
        scopes: tokenRecord?.scopes,
        consentAccepted: tokenRecord?.consent_accepted ?? false,
        consentDate: tokenRecord?.consent_date,
        consentFingerprint: tokenRecord?.consent_fingerprint,
        updatedAt: tokenRecord?.updated_at
      },
      metrics: metrics || null,
      statsHistory: history.map((h) => ({
        snapshotDate: h.recorded_at,
        stars: h.stars,
        commits: h.commits,
        prs: h.prs,
        issues: h.issues,
        followers: h.followers,
        languages: h.languages
      })),
      recentActivityLogs: logs.map((l) => ({
        cardType: l.card_type,
        source: l.source,
        timestamp: l.created_at
      }))
    };
  }
}
