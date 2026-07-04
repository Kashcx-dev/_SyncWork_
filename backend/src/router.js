import { Router } from 'express';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import profileRouter from './routes/profile.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Apply strict rate limiting (Type 1: 4 tries / 10 mins) to authentication routes
router.use('/auth', getRateLimiter(1), authRouter);

// Secure protected routes with verifyToken here in the central router
router.use('/dashboard', verifyToken, dashboardRouter);
router.use('/profile', verifyToken, profileRouter);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

export default router;
