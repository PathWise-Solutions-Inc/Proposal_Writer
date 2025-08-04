import { DataSource } from 'typeorm';

// For now, we'll create a simple database configuration without importing external entities
// In production, these would be properly defined entities with TypeORM decorators

export const createProposalServiceDataSource = () => {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'proposal_writer',
    entities: [], // Will be populated with actual entities later
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    migrations: ['dist/migrations/*.js'],
    migrationsTableName: 'proposal_service_migrations',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
};

let dataSource: DataSource;

export const initializeDatabase = async (): Promise<DataSource> => {
  if (!dataSource) {
    dataSource = createProposalServiceDataSource();
    await dataSource.initialize();
    console.log('✅ Proposal Service Database connected successfully');
  }
  return dataSource;
};

export const getDataSource = (): DataSource => {
  if (!dataSource) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return dataSource;
};

export const closeDatabase = async (): Promise<void> => {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
    console.log('🔌 Proposal Service Database connection closed');
  }
};