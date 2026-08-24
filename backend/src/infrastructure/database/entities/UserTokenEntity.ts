import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('user_tokens')
export class UserTokenEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  username!: string;

  @Column({ type: 'text' })
  encrypted_token!: string;

  @Column({ type: 'varchar', length: 100 })
  iv!: string;

  @Column({ type: 'varchar', length: 50, default: 'pat' })
  token_type!: string;

  @Column({ type: 'text', nullable: true })
  encrypted_refresh_token?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  refresh_token_iv?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at?: Date | null;

  @Column({ type: 'text', nullable: true })
  scopes?: string | null;

  @Column({ type: 'boolean', default: false })
  consent_accepted!: boolean;

  @Column({ type: 'timestamp with time zone' })
  consent_date!: Date;

  @Column({ type: 'varchar', length: 255 })
  consent_fingerprint!: string;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
