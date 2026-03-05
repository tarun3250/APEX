/**
 * Bottleneck Diagnosis Engine
 * Identifies performance issues based on metric patterns
 */
export const diagnoseBottlenecks = (metrics: any, percentiles: any) => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // 1. Tail Latency Issue
  if (percentiles.p95 > metrics.avgLatency * 2) {
    issues.push("Tail latency instability detected");
    recommendations.push("Investigate 'long tail' requests. This often indicates garbage collection spikes, resource contention, or specific slow database queries.");
  }

  // 2. Blocking Operations (Keeping this rule from existing logic)
  if (metrics.maxLatency > metrics.avgLatency * 5) {
    issues.push("Extreme Outlier Latency.");
    recommendations.push("Check for synchronous blocking operations in the request path or cold-start issues if using serverless functions.");
  }

  // 3. Scaling Issues (New Request Requirement)
  const rps = parseFloat(metrics.throughput);
  if (rps < 50) {
    issues.push("Server throughput is low. Consider scaling resources");
    recommendations.push("The system throughput is low. Consider horizontal scaling or optimizing the application's event loop/thread pool.");
  }

  // 4. Payload Bottleneck (New Request Requirement)
  if (metrics.avgSize > 300000) { // 300KB
    issues.push("Large response payload may slow down API");
    recommendations.push("Large response sizes are slowing down transfer times. Implement Gzip/Brotli, or use GraphQL/Field-filtering to reduce data transfer.");
  }

  // 5. Resource Bottleneck
  const errorRate = (metrics.failed / metrics.totalRequests) * 100;
  if (errorRate > 5) {
    issues.push("High Error Rate under concurrency.");
    recommendations.push("Errors are spiking under load. This suggests a resource bottleneck (e.g., database connection pool exhaustion or memory leaks).");
  }

  return { issues, recommendations };
};
