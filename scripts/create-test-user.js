const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'proposal_writer',
  entities: ['services/auth-service/src/models/*.ts'],
  synchronize: false,
  logging: false,
});

async function createTestUser() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const hashedPassword = await bcrypt.hash('Test123!@#', 10);
    
    const result = await AppDataSource.query(`
      INSERT INTO users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET password = $2
      RETURNING id, email, name, role
    `, ['rfptest@example.com', hashedPassword, 'Test User', 'user', true]);

    console.log('Test user created:', result[0]);
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUser();