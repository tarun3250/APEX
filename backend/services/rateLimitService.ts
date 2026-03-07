/**
 * Rate Limit Detection Module
 * Monitors status codes and extracts rate-limit headers
 */
export const analyzeRateLimits = (results: any[]) => {
    const throttlingRequests = results.filter(r => r.status === 429);
    const rateLimitDetected = (throttlingRequests.length / results.length) > 0.05;

    // Extract headers from the first request that has them (often 429s or high-load responses)
    const sampleRequest = throttlingRequests[0] || results[0];
    const headers = sampleRequest?.headers || {};

    const limitHeader = headers['x-ratelimit-limit'] || headers['ratelimit-limit'];
    const remaining = headers['x-ratelimit-remaining'] || headers['ratelimit-remaining'];
    const retryAfter = headers['retry-after'];

    return {
        rateLimitDetected,
        limitHeader: limitHeader ? parseInt(limitHeader) : null,
        remaining: remaining ? parseInt(remaining) : null,
        retryAfter: retryAfter ? parseInt(retryAfter) : null,
        recommendation: rateLimitDetected
            ? "Significant rate limiting detected. Implement exponential backoff and jitter in your client strategy."
            : remaining && parseInt(remaining) < 5
                ? "Approaching rate limit. Monitor usage closely."
                : null
    };
};
