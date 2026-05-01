import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

import { initializeDatabase, db } from "./backend/config/database.js";
import { globalErrorHandler } from "./backend/middlewares/errorHandler.js";
import { validateRequest } from "./backend/middlewares/validate.js";
import { globalLimiter, analysisLimiter } from "./backend/middlewares/rateLimiter.js";
import { requireIdempotency } from "./backend/middlewares/idempotency.js";
import { AnalysisController } from "./backend/controllers/analysis.ctrl.js";

import { getPerformanceTrends } from "./backend/services/trendService.js";
import { getUptimeStats } from "./backend/services/uptimeMonitor.js";
import { generatePDFReport } from "./backend/services/reportGenerator.js";
import { compareApis } from "./backend/services/comparisonService.js";
import { AnalysisService } from "./backend/services/analysis.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(express.json({ limit: '1mb' }));

    // Initialize DB schema
    initializeDatabase();

    // Apply global rate limiting
    app.use(globalLimiter);

    // Validation Schema for Analysis
    const analyzeSchema = z.object({
        body: z.object({
            url: z.string().url("Valid URL is required"),
            method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
            concurrency: z.number().min(1).max(100).default(1),
            requests: z.number().min(1).max(1000).default(10)
        })
    });

    // --- REFACTORED CORE ROUTE ---
    app.post(
        "/api/analyze",
        analysisLimiter, // Strict rate limit (e.g., 5 per 15 min)
        validateRequest(analyzeSchema), // Block invalid payloads
        requireIdempotency, // Return cached response if identical request
        AnalysisController.analyze // Clean controller layer
    );

    // --- EXISTING ROUTES (Using Shared DB Connection) ---
    app.get("/api/history", (req, res) => {
        const rows = db.prepare("SELECT * FROM history ORDER BY timestamp DESC LIMIT 50").all();
        res.json(rows.map((row: any) => ({
            ...row,
            metrics: JSON.parse(row.metrics),
            suggestions: JSON.parse(row.suggestions),
            headers: JSON.parse(row.headers)
        })));
    });

    app.get("/api/history/trends", (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: "URL query parameter is required" });
        const rows = db.prepare(`SELECT timestamp, score, metrics FROM history WHERE url = ? ORDER BY timestamp ASC`).all(url);
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

    app.get("/api/uptime", (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: "URL is required" });
        res.json(getUptimeStats(url as string));
    });

    app.get("/api/report/pdf/:id", async (req, res, next) => {
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
        } catch (error) {
            next(error);
        }
    });

    app.post("/api/compare", async (req, res, next) => {
        const { apiA, apiB } = req.body;
        if (!apiA || !apiB) return res.status(400).json({ error: "Both apiA and apiB configurations are required" });

        try {
            const [reportA, reportB] = await Promise.all([
                AnalysisService.runAnalysis(apiA.url, apiA.method, apiA.concurrency, apiA.requests, apiA),
                AnalysisService.runAnalysis(apiB.url, apiB.method, apiB.concurrency, apiB.requests, apiB)
            ]);

            const comparison = compareApis(reportA, reportB);
            res.json(comparison);
        } catch (error) {
            next(error);
        }
    });

    app.get("/api/system/info", (req, res) => {
        res.json({
            nodeVersion: process.version,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            platform: process.platform
        });
    });

    // --- Global Error Handler (MUST be after all routes) ---
    app.use(globalErrorHandler);

    // --- Vite frontend configuration ---
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
