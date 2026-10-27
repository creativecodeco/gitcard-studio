import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('repo_metrics')
export class RepoMetric {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  username!: string;

  @PrimaryColumn({ type: 'varchar', length: 100 })
  repo!: string;

  @Column({ type: 'integer', default: 0 })
  repo_views!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_github_hit!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_web_hit!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_updated!: Date;
}
