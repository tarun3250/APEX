import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    message: { status: 'error', message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const analysisLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Strict limit for load testing
    message: { status: 'error', message: 'Analysis limit reached. Please wait 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
