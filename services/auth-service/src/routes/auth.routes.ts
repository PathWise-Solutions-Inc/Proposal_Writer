import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { registerValidation, loginValidation } from '../middleware/validation';
import { loginLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', registerValidation, authController.register.bind(authController));
router.post('/login', loginLimiter, loginValidation, authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));

// Protected routes
router.post('/logout', authenticateToken, authController.logout.bind(authController));
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));

export default router;