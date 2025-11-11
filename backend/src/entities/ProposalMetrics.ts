import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Proposal } from './Proposal';

@Entity('proposal_metrics')
export class ProposalMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  proposalId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  durationAccuracy: number; // 0-100

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  costAccuracy: number; // 0-100

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  teamSizeAccuracy: number; // 0-100

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overallAccuracy: number; // 0-100

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Proposal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposalId' })
  proposal: Proposal;
}
