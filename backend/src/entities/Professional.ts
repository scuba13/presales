import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('professionals')
export class Professional {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  role: string; // "Tech Lead", "Backend Dev", "Frontend Dev", etc

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hourlyCost: number; // Custo por hora em BRL

  @Column({ type: 'varchar', length: 50 })
  seniority: string; // "Junior", "Pleno", "Senior"

  @Column('simple-array')
  skills: string[]; // ["Node.js", "React", "TypeScript"]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
