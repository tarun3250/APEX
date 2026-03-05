export const getPerformanceTrends = (historyRows: any[]) => {
    return historyRows.map((row) => {
        const metrics = JSON.parse(row.metrics);
        return {
            timestamp: row.timestamp,
            score: row.score,
            avgLatency: metrics.avgLatency,
            p95Latency: metrics.p95Latency,
            throughput: metrics.throughput
        };
    });
};
