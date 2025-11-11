import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('parameters')
export class Parameter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // "tax", "sga", "margin"

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  value: number; // 0.21 (21%), 0.10 (10%), 0.25 (25%)

  @Column({ type: 'varchar', length: 50 })
  type: string; // "percentage", "fixed"

  @Column({ type: 'text', nullable: true })
  description: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
