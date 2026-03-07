/**
 * AI Advisor Service (Bonus)
 * Interprets metrics and provides intelligent optimization paths
 */
export const getAIAdvice = (metrics: any, diagnosis: any) => {
    const score = metrics.score;
    const advice: string[] = [];

    if (metrics.avgLatency > 200) {
        advice.push("High latency detected. Consider implementing a caching layer (Redis/Memcached) for frequent read operations.");
    }

    if (diagnosis.issues.some((i: string) => i.includes("Tail latency"))) {
        advice.push("Tail latency spikes suggest uneven resource distribution. Check your database indexing or consider horizontal pod autoscaling.");
    }

    if (metrics.errorRate > 0) {
        advice.push("Network errors detected. Implement a Circuit Breaker pattern to protect your system from cascading failures.");
    }

    return {
        summary: `Your API is performing with a ${metrics.grade} grade. Focused improvements on ${metrics.avgLatency > 150 ? 'compute time' : 'network overhead'} could yield high ROI.`,
        advice
    };
};
