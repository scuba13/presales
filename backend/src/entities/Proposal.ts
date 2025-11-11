import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProposalResource } from './ProposalResource';

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  clientName: string;

  @Column({ type: 'varchar', length: 255 })
  projectName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string; // "draft", "generated", "sent", "approved", "rejected"

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;

  @Column({ type: 'int' })
  durationMonths: number;

  @Column({ type: 'text', nullable: true })
  excelFilePath: string; // Caminho para o arquivo Excel gerado

  @Column({ type: 'jsonb', nullable: true })
  claudeAnalysis: object; // Resultado da análise do Claude AI

  @Column({ type: 'varchar', length: 50, nullable: true })
  complexity: string; // "low", "medium", "high"

  // ========== CAMPOS DE APRENDIZADO ==========
  @Column({ type: 'jsonb', nullable: true })
  originalAIAnalysis: object; // Análise ORIGINAL da IA (imutável)

  @Column({ type: 'jsonb', nullable: true })
  userModifications: object; // Modificações feitas pelo usuário

  @Column({ type: 'boolean', default: false })
  wasModified: boolean; // Se foi modificada após geração

  @Column({ type: 'int', nullable: true })
  accuracyRating: number; // 1-5 estrelas

  @Column({ type: 'text', nullable: true })
  feedbackNotes: string; // Feedback do usuário

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date; // Timestamp de aprovação
  // ===========================================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProposalResource, (resource) => resource.proposal)
  resources: ProposalResource[];
}
