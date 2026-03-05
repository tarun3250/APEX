export const detectColdStart = (latencies: number[], avgLatency: number) => {
    if (latencies.length === 0) return { coldStartDetected: false, message: "" };

    const firstRequestLatency = latencies[0];
    const coldStartDetected = firstRequestLatency > (avgLatency * 2);

    return {
        coldStartDetected,
        message: coldStartDetected
            ? "Possible cold start behavior detected. First request latency significantly higher than subsequent requests."
            : ""
    };
};
