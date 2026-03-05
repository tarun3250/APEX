/**
 * API Comparison Service
 * Compares two analysis results and determines a winner
 */
export const compareApis = (apiA: any, apiB: any) => {
  let scoreA = 0;
  let scoreB = 0;

  // Comparison Logic
  if (apiA.metrics.avgLatency < apiB.metrics.avgLatency) scoreA++; else scoreB++;
  if (apiA.metrics.p95Latency < apiB.metrics.p95Latency) scoreA++; else scoreB++;
  if (parseFloat(apiA.metrics.throughput) > parseFloat(apiB.metrics.throughput)) scoreA++; else scoreB++;
  if (apiA.metrics.failed < apiB.metrics.failed) scoreA++; else scoreB++;

  const winner = scoreA > scoreB ? "apiA" : (scoreB > scoreA ? "apiB" : "tie");
  
  let summary = "";
  if (winner === "apiA") {
    summary = `${apiA.url} outperformed ${apiB.url} in ${scoreA} out of 4 key performance categories.`;
  } else if (winner === "apiB") {
    summary = `${apiB.url} outperformed ${apiA.url} in ${scoreB} out of 4 key performance categories.`;
  } else {
    summary = "Both APIs performed similarly across the tested metrics.";
  }

  return {
    apiA,
    apiB,
    winner,
    comparisonSummary: summary
  };
};
