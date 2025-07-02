import { Router } from 'express';
import { authController } from '@/controllers/authController';
import { authRateLimiter } from '@/middleware/rateLimiter';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Rate limiting for auth routes
router.use(async (req, res, next) => {
  try {
    const key = req.ip || 'unknown';
    await authRateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      timestamp: new Date().toISOString(),
    });
  }
});

// Authentication routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', asyncHandler(authController.resetPassword));
router.post('/verify-email', asyncHandler(authController.verifyEmail));
router.post('/resend-verification', asyncHandler(authController.resendVerification));

// OAuth routes
router.get('/facebook', asyncHandler(authController.facebookAuth));
router.get('/facebook/callback', asyncHandler(authController.facebookCallback));
router.get('/twitter', asyncHandler(authController.twitterAuth));
router.get('/twitter/callback', asyncHandler(authController.twitterCallback));
router.get('/linkedin', asyncHandler(authController.linkedinAuth));
router.get('/linkedin/callback', asyncHandler(authController.linkedinCallback));
router.get('/google', asyncHandler(authController.googleAuth));
router.get('/google/callback', asyncHandler(authController.googleCallback));

export default router;