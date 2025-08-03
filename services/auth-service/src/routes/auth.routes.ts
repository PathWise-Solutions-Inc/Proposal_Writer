import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { registerValidation, loginValidation } from '../middleware/validation';
import { loginLimiter, registrationLimiter } from '../middleware/rateLimiter';
import { csrfProtection, getCsrfToken } from '../middleware/csrf.middleware';

const router = Router();
const authController = new AuthController();

// CSRF token endpoint
router.get('/csrf-token', getCsrfToken);

// Public routes with CSRF protection and rate limiting
router.post('/register', registrationLimiter, csrfProtection, registerValidation, authController.register.bind(authController));
router.post('/login', csrfProtection, loginLimiter, loginValidation, authController.login.bind(authController));
router.post('/refresh', csrfProtection, authController.refreshToken.bind(authController));

// Protected routes with CSRF protection
router.post('/logout', csrfProtection, authenticateToken, authController.logout.bind(authController));
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));

export default router;