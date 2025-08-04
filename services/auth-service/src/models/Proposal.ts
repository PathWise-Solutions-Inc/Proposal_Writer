import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';
import { RFP } from './RFP';

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  proposalNumber: string;

  @Column({ type: 'jsonb' })
  structure: {
    sections: Array<{
      id: string;
      title: string;
      order: number;
      content?: string;
      subsections?: Array<{
        id: string;
        title: string;
        order: number;
        content?: string;
      }>;
      metadata?: {
        wordCount?: number;
        lastEditedBy?: string;
        lastEditedAt?: Date;
        aiGenerated?: boolean;
      };
    }>;
  };

  @Column({
    type: 'enum',
    enum: ['draft', 'in_review', 'finalized', 'submitted', 'won', 'lost'],
    default: 'draft'
  })
  status: 'draft' | 'in_review' | 'finalized' | 'submitted' | 'won' | 'lost';

  @Column({ type: 'jsonb', nullable: true })
  complianceTracking: {
    requirements?: Array<{
      requirementId: string;
      addressed: boolean;
      sectionIds: string[];
      notes?: string;
    }>;
    overallScore?: number;
    lastChecked?: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    clientInfo?: {
      name: string;
      industry?: string;
      size?: string;
      painPoints?: string[];
    };
    winThemes?: string[];
    discriminators?: string[];
    pricing?: {
      total?: number;
      currency?: string;
      breakdown?: any;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  collaborators: Array<{
    userId: string;
    role: 'owner' | 'editor' | 'reviewer' | 'viewer';
    addedAt: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  versions: Array<{
    versionNumber: number;
    createdAt: Date;
    createdBy: string;
    changes: string;
    snapshot?: any;
  }>;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'uuid' })
  rfpId: string;

  @ManyToOne(() => RFP)
  @JoinColumn({ name: 'rfpId' })
  rfp: RFP;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'date', nullable: true })
  submissionDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}