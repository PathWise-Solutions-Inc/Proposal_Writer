import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './User';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'free' })
  subscriptionTier: string;

  @Column({ type: 'int', default: 5 })
  maxUsers: number;

  @Column({ type: 'int', default: 10 })
  maxProposalsPerMonth: number;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    branding?: {
      primaryColor?: string;
      logo?: string;
    };
    features?: {
      aiContentGeneration?: boolean;
      clientResearch?: boolean;
      advancedAnalytics?: boolean;
    };
  };

  @OneToMany(() => User, user => user.organization)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}