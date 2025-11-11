import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Proposal } from './Proposal';
import { Professional } from './Professional';

@Entity('proposal_resources')
export class ProposalResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Proposal, (proposal) => proposal.resources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'proposal_id' })
  proposal: Proposal;

  @Column({ name: 'proposal_id' })
  proposalId: string;

  @ManyToOne(() => Professional)
  @JoinColumn({ name: 'professional_id' })
  professional: Professional;

  @Column({ name: 'professional_id' })
  professionalId: string;

  @Column('simple-array')
  hoursPerMonth: number[]; // [160, 160, 80, ...] - M1 a M10

  @Column('simple-array', { nullable: true })
  hoursPerWeek: number[]; // [40, 40, 40, ...] - S1 a S40 (40 semanas)

  @Column({ type: 'int' })
  totalHours: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cost: number; // Custo calculado (com impostos e SG&A)

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number; // Preço final (com margem)
}
