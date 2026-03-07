import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface Metrics {
  totalRequests: number;
  successful: number;
  failed: number;
  avgLatency: number;
  medianLatency: number;
  p95Latency: number;
  p50: number;
  p75: number;
  p90: number;
  p99: number;
  minLatency: number;
  maxLatency: number;
  throughput: string;
  avgSize: number;
  totalTime: number;
  latencyDistribution: number[];
  latencyTimeline: number[];
  coldStart: {
    coldStartDetected: boolean;
    message: string;
  };
  securityAudit: {
    missingHeaders: string[];
    detectedHeaders: string[];
  };
  breakdown?: {
    latencyScore: number;
    stabilityScore: number;
    payloadScore: number;
    securityScore: number;
    throughputScore: number;
  };
}

export interface AnalysisReport {
  id?: number;
  url: string;
  method: string;
  timestamp?: string;
  score: number;
  grade?: string;
  metrics: Metrics;
  suggestions: string[];
  headers: Record<string, string>;
  diagnosis?: {
    issues: string[];
    recommendations: string[];
  };
  rateLimit?: {
    rateLimitDetected: boolean;
    limitHeader?: number;
    remaining?: number;
    retryAfter?: number;
    recommendation?: string;
  };
  payloadAnalysis?: {
    averageResponseSize: number;
    maxSize: number;
    minSize: number;
    efficiencyRating: string;
    compressionRecommendation?: string;
  };
  aiAdvice?: string;
}

export interface ComparisonResult {
  apiA: AnalysisReport;
  apiB: AnalysisReport;
  winner: "apiA" | "apiB" | "tie";
  comparisonSummary: string;
}

export interface TrendData {
  timestamp: string;
  score: number;
  avgLatency: number;
  p95Latency: number;
  throughput: string;
}

export const analyzeApi = async (
  url: string,
  method: string,
  concurrency: number,
  requests: number,
  simulateSlowNetwork: boolean,
  headers: Record<string, string> = {},
  body?: string,
  geoRegion: string = 'None'
): Promise<AnalysisReport> => {
  const response = await api.post('/analyze', {
    url,
    method,
    concurrency,
    requests,
    simulateSlowNetwork,
    headers,
    body,
    geoRegion
  });
  return response.data;
};

export const getHistory = async (): Promise<AnalysisReport[]> => {
  const response = await api.get('/history');
  return response.data;
};

export const getReportById = async (id: string): Promise<AnalysisReport> => {
  const response = await api.get(`/history/${id}`);
  return response.data;
};

export const getSystemInfo = async () => {
  const response = await api.get('/system/info');
  return response.data;
};

export const compareApis = async (apiA: any, apiB: any): Promise<ComparisonResult> => {
  const response = await api.post('/compare', { apiA, apiB });
  return response.data;
};

export const getTrends = async (url: string): Promise<TrendData[]> => {
  const response = await api.get(`/history/trends?url=${encodeURIComponent(url)}`);
  return response.data;
};
