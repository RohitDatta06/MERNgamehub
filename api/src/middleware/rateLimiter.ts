import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: { message: 'Too many requests', code: 'RATE_LIMIT' } }
});

export const scoreLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: { message: 'Too many score submissions', code: 'RATE_LIMIT' } }
});