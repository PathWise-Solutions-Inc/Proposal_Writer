import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

@Entity('rfps')
export class RFP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  clientName: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    originalFileName?: string;
    fileSize?: number;
    pageCount?: number;
    uploadedBy?: string;
  };

  @Column({ type: 'text', nullable: true })
  extractedText: string;

  @Column({ type: 'jsonb', nullable: true })
  analysisResults: {
    evaluationCriteria?: Array<{
      criterion: string;
      weight: number;
      description: string;
    }>;
    requirements?: Array<{
      id: string;
      text: string;
      category: string;
      mandatory: boolean;
    }>;
    keyDates?: Array<{
      event: string;
      date: Date;
    }>;
    budgetRange?: {
      min?: number;
      max?: number;
      currency?: string;
    };
  };

  @Column({
    type: 'enum',
    enum: ['uploaded', 'processing', 'analyzed', 'error'],
    default: 'uploaded'
  })
  status: 'uploaded' | 'processing' | 'analyzed' | 'error';

  @Column({ type: 'varchar', length: 255 })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  uploadedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}