import rateLimit from 'express-rate-limit';

export const getRateLimiter = (type) => {
    if (type === 1) {
        // High-security limit: 4 total tries, then locked for 10 minutes
        return rateLimit({
            windowMs: 10 * 60 * 1000, 
            max: 4, 
            message: { message: "Too many attempts. Please wait 10 minutes before trying again." },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: true, // Only count failed attempts towards the limit

        });
    }

    // Default general limit: 100 requests per 15 minutes
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { message: "Too many requests from this IP, please try again later." },
        standardHeaders: true,
        legacyHeaders: false,
    });
};
