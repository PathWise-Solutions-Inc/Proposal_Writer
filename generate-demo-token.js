const jwt = require('jsonwebtoken');

// JWT configuration from .env file
const JWT_SECRET = 'p/7EEcNYb+2594YyGndE+7PGQ7uQV489qMRyQRMBbsiuMCHpxWvNJHkh/pXKyYi2xVRJ6CDOxLHbu7h/Q4QHSg==';
const JWT_ALGORITHM = 'HS256';

// Demo user payload
const demoUser = {
  userId: '550e8400-e29b-41d4-a716-446655440000', // UUID format
  email: 'demo@example.com',
  role: 'user',
  organizationId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' // UUID format
};

// Generate access token
const accessToken = jwt.sign(demoUser, JWT_SECRET, {
  expiresIn: '7d',
  algorithm: JWT_ALGORITHM,
});

console.log('\n=== DEMO AUTHENTICATION TOKEN ===');
console.log('User:', demoUser);
console.log('\nAccess Token:');
console.log(accessToken);
console.log('\n=== USAGE ===');
console.log('Use this token in Authorization header:');
console.log(`Authorization: Bearer ${accessToken}`);
console.log('\n=== CURL EXAMPLE ===');
console.log(`curl -H "Authorization: Bearer ${accessToken}" -X POST http://localhost:3000/api/rfp/upload`);
console.log('');