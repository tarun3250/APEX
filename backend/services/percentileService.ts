/**
 * Percentile Calculation Service
 * Uses the standard formula: index = ceil((percentile / 100) * N) - 1
 */
export const calculatePercentiles = (latencies: number[]) => {
  if (!latencies || latencies.length === 0) return {};
  
  const sorted = [...latencies].sort((a, b) => a - b);
  const n = sorted.length;

  const getPercentile = (p: number) => {
    const index = Math.ceil((p / 100) * n) - 1;
    return sorted[Math.max(0, index)];
  };

  return {
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99),
  };
};
