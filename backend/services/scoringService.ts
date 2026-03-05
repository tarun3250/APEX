/**
 * Advanced Weighted Scoring Model
 * Weights: Latency (40%), Stability (20%), Payload (15%), Security (15%), Throughput (10%)
 */
export const calculateAdvancedScore = (metrics: any, headers: any) => {
  // 1. Latency Score (40%)
  let latencyScore = 0;
  const avg = metrics.avgLatency;
  if (avg <= 50) latencyScore = 100;
  else if (avg <= 150) latencyScore = 80;
  else if (avg <= 300) latencyScore = 60;
  else latencyScore = 40;

  // 2. Stability Score (20%)
  let stabilityScore = 0;
  const errorRate = (metrics.failed / metrics.totalRequests) * 100;
  if (errorRate === 0) stabilityScore = 100;
  else if (errorRate < 5) stabilityScore = 80;
  else if (errorRate < 15) stabilityScore = 50;
  else stabilityScore = 20;

  // 3. Payload Efficiency (15%)
  let payloadScore = 0;
  const avgSize = metrics.avgSize; // in bytes
  if (avgSize < 100000) payloadScore = 100;
  else if (avgSize < 500000) payloadScore = 70;
  else payloadScore = 40;

  // 4. Security Headers (15%)
  let securityScore = 0;
  const securityHeaders = [
    'strict-transport-security',
    'x-content-type-options',
    'content-security-policy',
    'access-control-allow-origin' // Simplified check for CORS
  ];
  const presentCount = securityHeaders.filter(h => headers[h]).length;
  securityScore = (presentCount / securityHeaders.length) * 100;

  // 5. Throughput Score (10%)
  let throughputScore = 0;
  const rps = parseFloat(metrics.throughput);
  if (rps > 200) throughputScore = 100;
  else if (rps > 100) throughputScore = 80;
  else if (rps > 50) throughputScore = 60;
  else throughputScore = 40;

  const finalScore = Math.round(
    (latencyScore * 0.40) +
    (stabilityScore * 0.20) +
    (payloadScore * 0.15) +
    (securityScore * 0.15) +
    (throughputScore * 0.10)
  );

  let grade = 'D';
  if (finalScore >= 90) grade = 'A';
  else if (finalScore >= 75) grade = 'B';
  else if (finalScore >= 60) grade = 'C';

  return { score: finalScore, grade, breakdown: { latencyScore, stabilityScore, payloadScore, securityScore, throughputScore } };
};
