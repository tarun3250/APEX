# APEX - API Performance Evaluation & Examination

## Advanced Features
- **Extended Percentile Metrics**: Calculates P50, P75, P90, P95, and P99 latency for deep statistical insight.
- **Request Timeline Visualization**: View the individual response time of every request in an interactive Chart.js line graph to spot instability.
- **Cold Start Detection**: Automatically detects serverless or lazy initialization delays by identifying if the first request is significantly slower (2x the average).
- **Security Header Audit**: Scans the API response for critical security headers (CSP, HSTS, CORS) and visually enumerates what is detected vs. what is missing.
- **API Comparison Mode**: Side-by-side analysis of two endpoints to determine the performance leader.
- **Weighted Scoring Model**: Industry-aligned scoring based on Latency (40%), Stability (20%), Payload (15%), Security (15%), and Throughput (10%).
- **Bottleneck Diagnosis Engine**: Automated, intelligence-driven heuristics pinpointing tail latency instability, oversized payloads, and insufficient resource allocation under scale.
- **Performance Trends Dashboard**: Rich historical tracking inside a Chart.js view, charting Scores, P95 Latency, Avg Latency, and overall Throughput (RPS) over time.

## Architecture
- **Backend**: Node.js/Express server with modular services for percentiles, scoring, and diagnosis.
- **Database**: SQLite for persistent storage of test history, statistical metrics, and diagnosis reports.
- **Frontend**: React SPA with Recharts for advanced data visualization and a professional dark-themed UI.

## How it Works
1. **Load Testing**: Uses batched concurrent requests to simulate real-world traffic patterns.
2. **Metrics**: Comprehensive statistical analysis including percentiles and throughput.
3. **Scoring**: A weighted algorithm assigns a letter grade (A-D) based on multi-dimensional performance data.
4. **Diagnosis**: Rule-based engine analyzes patterns to suggest specific infrastructure or code-level bottlenecks.

## Security
- URL validation ensures only valid HTTP/HTTPS endpoints are tested.
- Localhost and internal IP ranges are blocked to prevent SSRF.
- Concurrency and request counts are capped to prevent abuse.
