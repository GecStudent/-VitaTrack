import express from 'express';
import registerRouter from './register';
import loginRouter from './login';
import logoutRouter from './logout';
import refreshTokenRouter from './refresh';
import verifyEmailRouter from './verify-email';
import passwordResetRouter from './password-reset';
import { authenticateJWT } from '../../auth/middleware';

const router = express.Router();

// Public routes
router.use('/register', registerRouter);
router.use('/login', loginRouter);
router.use('/refresh', refreshTokenRouter);
router.use('/verify-email', verifyEmailRouter);
router.use('/password-reset', passwordResetRouter);

// Protected routes
router.use('/logout', authenticateJWT, logoutRouter);

export default router;