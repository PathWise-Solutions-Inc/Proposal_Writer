# Auth Service

## Overview
The Auth Service handles all authentication and authorization for the Proposal Writer platform. It provides secure JWT-based authentication with refresh tokens, CSRF protection, and rate limiting.

## Features
- JWT authentication with access and refresh tokens
- User registration with secure password validation
- Login with automatic token refresh
- CSRF protection on all state-changing operations
- Rate limiting on auth endpoints
- Role-based access control (admin, user)
- Secure password hashing with bcrypt
- Comprehensive security logging

## API Endpoints

### Public Endpoints
- `GET /api/auth/csrf-token` - Get CSRF token for forms
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### Protected Endpoints
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Rate Limiting
- Registration: 5 requests per hour per IP
- Login: 10 requests per 15 minutes per IP

### Token Configuration
- Access Token: 15 minutes expiry
- Refresh Token: 7 days expiry
- Tokens stored as HTTP-only cookies

### CSRF Protection
All POST/PUT/DELETE requests require a valid CSRF token

## Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/proposal_writer

# JWT Secrets
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Server
PORT=8001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Database Models

### User Model
- id (UUID)
- email (unique)
- password (hashed)
- firstName
- lastName
- role (admin, user)
- isActive
- createdAt
- updatedAt

## Development

### Start the service
```bash
npm run dev
```

### Run tests
```bash
npm test
```

### Build for production
```bash
npm run build
npm start
```

## Security Best Practices
1. Always use HTTPS in production
2. Keep JWT secrets secure and rotate regularly
3. Monitor rate limiting logs for potential attacks
4. Review security logs regularly
5. Keep dependencies updated