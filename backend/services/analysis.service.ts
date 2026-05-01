import axios from "axios";
import { calculatePercentiles } from "./percentileService.js";
import { calculateAdvancedScore } from "./scoringService.js";
import { diagnoseBottlenecks } from "./bottleneckAnalyzer.js";
import { getLatencyTimeline } from "./timelineService.js";
import { detectColdStart } from "./coldStartDetector.js";
import { analyzeSecurityHeaders } from "./securityAuditService.js";
import { analyzeRateLimits } from "./rateLimitService.js";
import { analyzePayloadSizes } from "./payloadAnalyzer.js";
import { getAIAdvice } from "./aiAdvisor.js";
import { ValidationError } from "../utils/errors.js";

export const AnalysisService = {
    runAnalysis: async (url: string, method: string = "GET", concurrency: number = 1, requests: number = 10, reqBody: any = {}) => {
        const results: any[] = [];
        const startTotal = Date.now();

        // Security check
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1" || parsedUrl.hostname.startsWith("192.168.") || parsedUrl.hostname.startsWith("10.")) {
                throw new ValidationError("Internal network scanning is prohibited.");
            }
        } catch (e: any) {
            throw new ValidationError("Invalid URL: " + e.message);
        }

        // Batched requests
        const batchSize = Math.min(concurrency, 10);
        for (let i = 0; i < requests; i += batchSize) {
            const currentBatchSize = Math.min(batchSize, requests - i);
            const batchPromises = Array.from({ length: currentBatchSize }).map(async () => {
                const start = Date.now();
                try {
                    if (reqBody.simulateSlowNetwork) {
                        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
                    }

                    const geoDelays: Record<string, number> = {
                        'US-East': 40, 'Europe': 120, 'Asia': 220, 'Australia': 300
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
                    return {
                        latency: Date.now() - start,
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

        const percentiles = calculatePercentiles(latencies);
        const firstSuccess = results.find(r => r.success) || results[0];
        const headers = firstSuccess?.headers || {};

        const latencyTimeline = getLatencyTimeline(latencies);
        const coldStart = detectColdStart(latencies, avgLatency);
        const securityAudit = analyzeSecurityHeaders(headers as Record<string, string>);

        const metricsData = {
            totalRequests: results.length,
            successful, failed, avgLatency, avgSize, throughput,
            minLatency, maxLatency, medianLatency, p95Latency,
            ...percentiles, latencyDistribution: latencies,
            latencyTimeline, coldStart, securityAudit, breakdown: {} as any
        };
        const { score, grade, breakdown } = calculateAdvancedScore(metricsData, headers);
        metricsData.breakdown = breakdown;

        const diagnosis = diagnoseBottlenecks({ ...metricsData, maxLatency }, percentiles);
        const suggestions: string[] = [];
        
        if (!headers['content-encoding']?.includes('gzip') && !headers['content-encoding']?.includes('br')) {
            suggestions.push("Enable Gzip or Brotli compression to reduce payload size.");
        }
        if (diagnosis.recommendations.length > 0) suggestions.push(...diagnosis.recommendations);

        const rateLimit = analyzeRateLimits(results);
        const payloadAnalysis = analyzePayloadSizes(results);
        const aiAdvice = getAIAdvice(metricsData, diagnosis);

        if (rateLimit.recommendation) suggestions.push(rateLimit.recommendation);
        suggestions.push(...payloadAnalysis.recommendations);
        suggestions.push(...aiAdvice.advice);

        return {
            url, method, score, grade,
            metrics: metricsData,
            suggestions,
            headers: JSON.stringify(headers),
            diagnosis, rateLimit, payloadAnalysis,
            geoRegion: reqBody.geoRegion || 'None',
            aiAdvice: aiAdvice.advice.join('\n')
        };
    }
};
