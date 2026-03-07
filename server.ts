import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import axios from "axios";
import { calculatePercentiles } from "./backend/services/percentileService.js";
import { calculateAdvancedScore } from "./backend/services/scoringService.js";
import { diagnoseBottlenecks } from "./backend/services/bottleneckAnalyzer.js";
import { compareApis } from "./backend/services/comparisonService.js";
import { getLatencyTimeline } from "./backend/services/timelineService.js";
import { detectColdStart } from "./backend/services/coldStartDetector.js";
import { analyzeSecurityHeaders } from "./backend/services/securityAuditService.js";
import { getPerformanceTrends } from "./backend/services/trendService.js";
import { analyzeRateLimits } from "./backend/services/rateLimitService.js";
import { analyzePayloadSizes } from "./backend/services/payloadAnalyzer.js";
import { startUptimeMonitor, getUptimeStats } from "./backend/services/uptimeMonitor.js";
import { generatePDFReport } from "./backend/services/reportGenerator.js";
import { getAIAdvice } from "./backend/services/aiAdvisor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Database Setup ---
const db = new Database("apoa.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    method TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    score INTEGER,
    grade TEXT,
    metrics TEXT,
    suggestions TEXT,
    headers TEXT,
    diagnosis TEXT,
    rateLimit TEXT,
    payloadAnalysis TEXT,
    geoRegion TEXT
  )
`);

// --- Analyzer Logic ---
async function analyzeApi(url: string, method: string = "GET", concurrency: number = 1, requests: number = 10, reqBody: any = {}) {
  const results: any[] = [];
  const startTotal = Date.now();

  // Security check
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1" || parsedUrl.hostname.startsWith("192.168.") || parsedUrl.hostname.startsWith("10.")) {
      throw new Error("Internal network scanning is prohibited.");
    }
  } catch (e: any) {
    throw new Error("Invalid URL: " + e.message);
  }

  // Batched requests
  const batchSize = Math.min(concurrency, 10);
  for (let i = 0; i < requests; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, requests - i);
    const batchPromises = Array.from({ length: currentBatchSize }).map(async () => {
      const start = Date.now();
      try {
        // Network Simulation: Delay injection
        if (reqBody.simulateSlowNetwork) {
          await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        }

        // Geo Latency Simulation
        const geoDelays: Record<string, number> = {
          'US-East': 40,
          'Europe': 120,
          'Asia': 220,
          'Australia': 300
        };
        const geoDelay = geoDelays[reqBody.geoRegion] || 0;
        if (geoDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, geoDelay));
        }

        const response = await axios({
          url,
          method,
          headers: reqBody.headers || {},
          data: reqBody.body ? JSON.parse(reqBody.body) : undefined,
          timeout: 15000,
          validateStatus: () => true,
        });
        const end = Date.now();
        return {
          latency: end - start,
          status: response.status,
          size: JSON.stringify(response.data).length,
          headers: response.headers,
          success: response.status >= 200 && response.status < 300,
        };
      } catch (error: any) {
        return {
          latency: Date.now() - start,
          status: error.response?.status || 0,
          size: 0,
          headers: {},
          success: false,
          error: error.message,
        };
      }
    });
    results.push(...(await Promise.all(batchPromises)));
  }

  const endTotal = Date.now();
  const totalTime = endTotal - startTotal;

  // Metrics Calculation
  const latencies = results.map(r => r.latency).sort((a, b) => a - b);
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / results.length;
  const medianLatency = latencies[Math.floor(latencies.length / 2)];
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const totalSize = results.reduce((a, b) => a + b.size, 0);
  const avgSize = totalSize / results.length;
  const throughput = (results.length / (totalTime / 1000)).toFixed(2);

  // --- NEW: Extended Percentiles ---
  const percentiles = calculatePercentiles(latencies);

  // Header Analysis (using the first successful response if available)
  const firstSuccess = results.find(r => r.success) || results[0];
  const headers = firstSuccess?.headers || {};

  // --- NEW: Analytics Services Integration ---
  const latencyTimeline = getLatencyTimeline(latencies);
  const coldStart = detectColdStart(latencies, avgLatency);
  const securityAudit = analyzeSecurityHeaders(headers as Record<string, string>);

  // --- NEW: Advanced Scoring ---
  const metricsData = {
    totalRequests: results.length,
    successful,
    failed,
    avgLatency,
    avgSize,
    throughput,
    minLatency,
    maxLatency,
    medianLatency,
    p95Latency,
    ...percentiles,
    latencyDistribution: latencies,
    latencyTimeline,
    coldStart,
    securityAudit,
    breakdown: {} as any
  };
  const { score, grade, breakdown } = calculateAdvancedScore(metricsData, headers);
  metricsData.breakdown = breakdown;

  // --- NEW: Bottleneck Diagnosis ---
  const diagnosis = diagnoseBottlenecks({ ...metricsData, maxLatency }, percentiles);

  const suggestions: string[] = [];
  // Keep existing rule-based suggestions for backward compatibility or merge them
  if (!headers['content-encoding']?.includes('gzip') && !headers['content-encoding']?.includes('br')) {
    suggestions.push("Enable Gzip or Brotli compression to reduce payload size.");
  }
  // ... (other existing suggestions)
  if (diagnosis.recommendations.length > 0) {
    suggestions.push(...diagnosis.recommendations);
  }

  // --- NEW: Production Features Logic ---
  const rateLimit = analyzeRateLimits(results);
  const payloadAnalysis = analyzePayloadSizes(results);
  const aiAdvice = getAIAdvice(metricsData, diagnosis); // Changed 'metrics' to 'metricsData' as 'metrics' is not defined here

  if (rateLimit.recommendation) suggestions.push(rateLimit.recommendation);
  suggestions.push(...payloadAnalysis.recommendations);
  suggestions.push(...aiAdvice.advice);

  return {
    url,
    method,
    score,
    grade,
    metrics: metricsData,
    suggestions,
    headers: JSON.stringify(headers),
    diagnosis,
    rateLimit,
    payloadAnalysis,
    geoRegion: reqBody.geoRegion || 'None',
    aiAdvice: aiAdvice.advice.join('\n')
  };
}

// --- Server Setup ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    const { url, method, concurrency, requests, headers, body } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const report = await analyzeApi(url, method, concurrency, requests, req.body);
      const stmt = db.prepare(`
        INSERT INTO history (url, method, score, grade, metrics, suggestions, headers, diagnosis, rateLimit, payloadAnalysis, geoRegion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        report.url,
        report.method,
        report.score,
        report.grade,
        JSON.stringify(report.metrics),
        JSON.stringify(report.suggestions),
        report.headers,
        JSON.stringify(report.diagnosis),
        JSON.stringify(report.rateLimit),
        JSON.stringify(report.payloadAnalysis),
        report.geoRegion
      );

      // Start uptime monitor for this URL
      startUptimeMonitor(url);

      res.json({ id: info.lastInsertRowid, ...report, metrics: report.metrics, suggestions: report.suggestions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/history", (req, res) => {
    const rows = db.prepare("SELECT * FROM history ORDER BY timestamp DESC LIMIT 50").all();
    res.json(rows.map((row: any) => ({
      ...row,
      metrics: JSON.parse(row.metrics),
      suggestions: JSON.parse(row.suggestions),
      headers: JSON.parse(row.headers)
    })));
  });

  // --- NEW: Trends Endpoint ---
  app.get("/api/history/trends", (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL query parameter is required" });

    const rows = db.prepare(`
      SELECT timestamp, score, metrics 
      FROM history 
      WHERE url = ? 
      ORDER BY timestamp ASC
    `).all(url);

    res.json(getPerformanceTrends(rows));
  });

  app.get("/api/history/:id", (req, res) => {
    const row: any = db.prepare("SELECT * FROM history WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Report not found" });
    res.json({
      ...row,
      metrics: JSON.parse(row.metrics),
      suggestions: JSON.parse(row.suggestions),
      headers: JSON.parse(row.headers),
      diagnosis: row.diagnosis ? JSON.parse(row.diagnosis) : null,
      rateLimit: row.rateLimit ? JSON.parse(row.rateLimit) : null,
      payloadAnalysis: row.payloadAnalysis ? JSON.parse(row.payloadAnalysis) : null,
      geoRegion: row.geoRegion
    });
  });

  // --- NEW: Production API Routes ---
  app.get("/api/uptime", (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL is required" });
    res.json(getUptimeStats(url as string));
  });

  app.get("/api/report/pdf/:id", async (req, res) => {
    try {
      const row: any = db.prepare("SELECT * FROM history WHERE id = ?").get(req.params.id);
      if (!row) return res.status(404).json({ error: "Report not found" });

      const reportData = {
        ...row,
        metrics: JSON.parse(row.metrics),
        suggestions: JSON.parse(row.suggestions),
        diagnosis: row.diagnosis ? JSON.parse(row.diagnosis) : null
      };

      const pdfBuffer = await generatePDFReport(reportData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=APEX-Report-${req.params.id}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- NEW: Comparison Endpoint ---
  app.post("/api/compare", async (req, res) => {
    const { apiA, apiB } = req.body;
    if (!apiA || !apiB) return res.status(400).json({ error: "Both apiA and apiB configurations are required" });

    try {
      const [reportA, reportB] = await Promise.all([
        analyzeApi(apiA.url, apiA.method, apiA.concurrency, apiA.requests, apiA),
        analyzeApi(apiB.url, apiB.method, apiB.concurrency, apiB.requests, apiB)
      ]);

      const comparison = compareApis(reportA, reportB);
      res.json(comparison);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- NEW: Trends Endpoint ---
  app.get("/api/history/trends", (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL query parameter is required" });

    const rows = db.prepare(`
      SELECT timestamp, score, metrics 
      FROM history 
      WHERE url = ? 
      ORDER BY timestamp ASC
    `).all(url);

    res.json(getPerformanceTrends(rows));
  });

  app.get("/api/system/info", (req, res) => {
    res.json({
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      platform: process.platform
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
