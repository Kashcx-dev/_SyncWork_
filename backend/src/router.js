import { Router } from 'express';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import profileRouter from './routes/profile.js';
import employeeRouter from './routes/employee.js';
import leaveRouter from './routes/leave.js';
import payrollRouter from './routes/payroll.js';
import chatRouter from './routes/chat.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Apply strict rate limiting (Type 1: 4 tries / 10 mins) to authentication routes
router.use('/auth', getRateLimiter(1), authRouter);

// Secure protected routes with verifyToken here in the central router
router.use('/dashboard', verifyToken, dashboardRouter);
router.use('/profile', verifyToken, profileRouter);
router.use('/employees', verifyToken, employeeRouter);
router.use('/leaves', verifyToken, leaveRouter);
router.use('/payroll', verifyToken, payrollRouter);
router.use('/chat', verifyToken, chatRouter);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

export default router;
