import { DataSource } from 'typeorm';
import { User } from '../../../auth-service/src/models/User';
import { Organization } from '../../../auth-service/src/models/Organization';
import { RFP } from '../../../auth-service/src/models/RFP';
import { Proposal } from '../../../auth-service/src/models/Proposal';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'proposal_writer',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Organization, RFP, Proposal],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});