import { Router } from 'express';
import authRouter from './routes/auth.js';

const router = Router();

router.use('/auth', authRouter);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

export default router;
