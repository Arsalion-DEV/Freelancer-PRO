import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import config from '@/config';
import { APIResponse, ErrorCode } from '@/types';

// Create rate limiter instance
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: config.rateLimit.maxRequests, // Number of requests
  duration: config.rateLimit.windowMs / 1000, // Per duration in seconds
});

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use IP address as key
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    
    await rateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    const response: APIResponse = {
      success: false,
      error: 'Too many requests, please try again later',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    res.set('Retry-After', String(secs));
    res.status(429).json(response);
  }
};

// Export as default for convenience
export default rateLimiterMiddleware;

// More specific rate limiters for different endpoints
export const strictRateLimiter = new RateLimiterMemory({
  keyPrefix: 'strict',
  points: 5, // 5 requests
  duration: 60, // per minute
});

export const authRateLimiter = new RateLimiterMemory({
  keyPrefix: 'auth',
  points: 10, // 10 requests
  duration: 300, // per 5 minutes
});

export const apiRateLimiter = new RateLimiterMemory({
  keyPrefix: 'api',
  points: 100, // 100 requests
  duration: 60, // per minute
});