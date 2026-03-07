import React, { useState, useEffect } from 'react';
import {
  Activity,
  History,
  BarChart3,
  Zap,
  Shield,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Download,
  Search,
  ShieldCheck,
  Globe,
  Clock,
  Database,
  ChevronRight,
  Info,
  Rocket,
  ZapIcon,
  ServerCrash,
  Settings2,
  Plus,
  Trash2,
  Key,
  FileJson,
  ShieldAlert,
  Archive,
  Terminal,
  BarChart as BarChartIcon
} from 'lucide-react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  analyzeApi,
  getHistory,
  getReportById,
  compareApis,
  getTrends,
  AnalysisReport,
  Metrics,
  ComparisonResult,
  TrendData
} from './services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line as ChartJSLine } from 'react-chartjs-2';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface ComparisonRequest {
  url: string;
  method: string;
  concurrency: number;
  requests: number;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Card = ({ children, className, delay = 0, ...props }: { children: React.ReactNode, className?: string, delay?: number, [key: string]: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    className={cn("glass rounded-2xl p-6 hover:shadow-[0_8px_32px_rgba(34,197,94,0.1)] transition-shadow duration-300 relative overflow-hidden flex flex-col", className)}
    {...props}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <div className="relative z-10 flex-1 w-full h-full flex flex-col">{children}</div>
  </motion.div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' }) => {
  const variants = {
    default: 'bg-zinc-800 text-zinc-300',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant])}>
      {children}
    </span>
  );
};

const ScoreCircle = ({ score }: { score: number }) => {
  const getColor = (s: number) => {
    if (s >= 90) return 'text-emerald-400';
    if (s >= 75) return 'text-blue-400';
    if (s >= 60) return 'text-amber-400';
    return 'text-red-400';
  };
  const getGrade = (s: number) => {
    if (s >= 90) return 'A';
    if (s >= 75) return 'B';
    if (s >= 60) return 'C';
    return 'D';
  };

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="58"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-zinc-800"
        />
        <circle
          cx="64"
          cy="64"
          r="58"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={364.4}
          strokeDashoffset={364.4 - (364.4 * score) / 100}
          className={cn("transition-all duration-1000 ease-out", getColor(score))}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-4xl font-bold", getColor(score))}>{getGrade(score)}</span>
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{score}%</span>
      </div>
    </div>
  );
};

const TopNav = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Analysis', icon: ZapIcon },
    { path: '/analytics', label: 'Analytics', icon: BarChartIcon },
    { path: '/uptime', label: 'Uptime', icon: Clock },
    { path: '/compare', label: 'Compare APIs', icon: Activity },
    { path: '/history', label: 'History', icon: History }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/5 backdrop-blur-2xl print:hidden">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-purple-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">APEX</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                  isActive ? "text-emerald-400" : "text-zinc-400 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 border-b-2 border-emerald-400 rounded-lg bg-emerald-400/10 -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

// --- Pages ---

const Dashboard = () => {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [concurrency, setConcurrency] = useState(5);
  const [requests, setRequests] = useState(50);
  const [geoRegion, setGeoRegion] = useState('None');
  const [simulateSlowNetwork, setSimulateSlowNetwork] = useState(false);
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const presets = [
    { title: "Standard JSON API", url: "https://jsonplaceholder.typicode.com/posts", icon: Globe, color: "text-blue-400" },
    { title: "High-Traffic Simulation", url: "https://jsonplaceholder.typicode.com/comments", icon: ZapIcon, color: "text-emerald-400", req: 100, conc: 10 },
    { title: "Slow External API", url: "https://httpstat.us/200?sleep=1000", icon: Clock, color: "text-amber-400" }
  ];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const headerObj = headers.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key.trim()] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      const report = await analyzeApi(
        url,
        method,
        concurrency,
        requests,
        simulateSlowNetwork,
        headerObj,
        body || undefined,
        geoRegion
      );
      navigate(`/report/${report.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center space-y-4"
      >
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-white to-purple-500 bg-clip-text text-transparent drop-shadow-sm">
          APEX Performance Advisor
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          API Performance Evaluation & Examination. Analyze latency, payload size, and security headers with automated optimization recommendations.
        </p>
      </motion.div>

      <Card className="p-8">
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Endpoint URL
            </label>
            <div className="flex gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
              <input
                type="url"
                required
                placeholder="https://api.example.com/v1/data"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Concurrency
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <p className="text-[10px] text-zinc-500">Simultaneous requests to send.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Total Requests
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={requests}
                onChange={(e) => setRequests(parseInt(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <p className="text-[10px] text-zinc-500">Total sample size for analysis.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
            <input
              type="checkbox"
              id="simulate"
              checked={simulateSlowNetwork}
              onChange={(e) => setSimulateSlowNetwork(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500/50 bg-zinc-900"
            />
            <label htmlFor="simulate" className="text-sm font-medium text-zinc-300 cursor-pointer select-none">
              Simulate Slow Network (Adds 200-500ms latency per request)
            </label>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-emerald-400/70 hover:text-emerald-400 flex items-center gap-2 transition-colors uppercase tracking-widest"
            >
              <Settings2 className={cn("w-3.5 h-3.5 transition-transform duration-300", showAdvanced && "rotate-90")} />
              {showAdvanced ? "Hide Advanced Settings" : "Configure Headers & Body"}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Geo Simulation:</span>
              <select
                value={geoRegion}
                onChange={(e) => setGeoRegion(e.target.value)}
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-2 py-1 text-[10px] font-bold text-emerald-400 outline-none"
              >
                <option>None</option>
                <option>US-East</option>
                <option>Europe</option>
                <option>Asia</option>
                <option>Australia</option>
              </select>
            </div>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-6"
              >
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                      <Key className="w-3 h-3" /> Custom Headers
                    </label>
                    <div className="space-y-2">
                      {headers.map((h, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            placeholder="Key (e.g. Authorization)"
                            value={h.key}
                            onChange={(e) => {
                              const newHeaders = [...headers];
                              newHeaders[i].key = e.target.value;
                              setHeaders(newHeaders);
                            }}
                            className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500/30"
                          />
                          <input
                            placeholder="Value"
                            value={h.value}
                            onChange={(e) => {
                              const newHeaders = [...headers];
                              newHeaders[i].value = e.target.value;
                              setHeaders(newHeaders);
                            }}
                            className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500/30"
                          />
                          {headers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setHeaders(headers.filter((_, idx) => idx !== i))}
                              className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setHeaders([...headers, { key: '', value: '' }])}
                        className="text-[10px] font-bold text-zinc-500 hover:text-emerald-400 flex items-center gap-1 transition-colors uppercase"
                      >
                        <Plus className="w-3 h-3" /> Add Header
                      </button>
                    </div>
                  </div>

                  {['POST', 'PUT', 'PATCH'].includes(method) && (
                    <div className="space-y-3 pt-4">
                      <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                        <FileJson className="w-3 h-3" /> Request Body (JSON)
                      </label>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder='{ "key": "value" }'
                        className="w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-emerald-500/30 resize-none"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Endpoint...
              </>
            ) : (
              <>
                Run Performance Analysis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setUrl(p.url);
              setMethod('GET');
              if (p.req) setRequests(p.req);
              if (p.conc) setConcurrency(p.conc);
            }}
            className="glass-hover rounded-xl p-4 flex flex-col items-start text-left transition-all border border-white/5 bg-white/[0.02] group"
          >
            <p className={cn("text-sm font-bold mb-2 flex items-center gap-2", p.color)}>
              <p.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {p.title}
            </p>
            <p className="text-xs text-zinc-500 font-mono truncate w-full">{p.url}</p>
          </button>
        ))}
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        <Card delay={0.4} className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold">Latency Analysis</h3>
          <p className="text-xs text-zinc-500">P95, Median, and Average response times.</p>
        </Card>
        <Card delay={0.5} className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-semibold">Security Audit</h3>
          <p className="text-xs text-zinc-500">HSTS, CSP, and CORS header validation.</p>
        </Card>
        <Card delay={0.6} className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-semibold">Load Simulation</h3>
          <p className="text-xs text-zinc-500">Throughput and error rate under stress.</p>
        </Card>
      </div>
    </motion.div>
  );
};

const ReportView = () => {
  const { id } = useParams();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getReportById(id).then(data => {
        setReport(data);
        getTrends(data.url).then(setTrends);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  if (!report) return <div>Report not found.</div>;

  const latencyData = (report.metrics.latencyDistribution || []).map((l, i) => ({ name: i, value: l }));
  const successRateData = [
    { name: 'Success', value: report.metrics.successful || 0, color: '#10b981' },
    { name: 'Failed', value: report.metrics.failed || 0, color: '#ef4444' },
  ];

  const percentileData = [
    { label: 'P50 (Median)', value: `${report.metrics.p50 || 0}ms` },
    { label: 'P75', value: `${report.metrics.p75 || 0}ms` },
    { label: 'P90', value: `${report.metrics.p90 || 0}ms` },
    { label: 'P95', value: `${report.metrics.p95 || 0}ms` },
    { label: 'P99', value: `${report.metrics.p99 || 0}ms` },
  ];

  const handleExportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apoa-report-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!report) return;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['URL', report.url],
      ['Method', report.method],
      ['Grade', report.grade || 'N/A'],
      ['Score', `${report.score}%`],
      ['Avg Latency', `${report.metrics.avgLatency.toFixed(2)}ms`],
      ['P95 Latency', `${report.metrics.p95Latency.toFixed(2)}ms`],
      ['Throughput', `${report.metrics.throughput} RPS`],
      ['Total Requests', report.metrics.totalRequests],
      ['Successful', report.metrics.successful],
      ['Failed', report.metrics.failed],
      ['Success Rate', `${((report.metrics.successful / report.metrics.totalRequests) * 100).toFixed(2)}%`],
      ['Min Latency', `${report.metrics.minLatency}ms`],
      ['Max Latency', `${report.metrics.maxLatency}ms`],
      ['Avg Payload', `${(report.metrics.avgSize / 1024).toFixed(2)}KB`],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `apoa-report-${report.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyReport = () => {
    if (!report) return;
    const summary = `
🚀 APEX Performance Report
=========================
URL: ${report.url}
Method: ${report.method}
Grade: ${report.grade}
Score: ${report.score}%

📊 Core Metrics
--------------
Average Latency: ${report.metrics.avgLatency.toFixed(0)}ms
P95 Latency: ${report.metrics.p95Latency.toFixed(0)}ms
Throughput: ${report.metrics.throughput} RPS
Success Rate: ${((report.metrics.successful / report.metrics.totalRequests) * 100).toFixed(1)}%

⚠️ Top Issue Detected
-------------------
${report.diagnosis?.issues[0] || "None - Perfect Optimization"}
    `.trim();

    navigator.clipboard.writeText(summary);
    alert("Report summary copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Badge variant="default">{report.method}</Badge>
            <h1 className="text-2xl font-bold font-mono truncate max-w-xl">{report.url}</h1>
            <Badge variant={report.grade === 'A' ? 'success' : report.grade === 'B' ? 'default' : 'warning'}>
              Grade {report.grade}
            </Badge>
          </div>
          <p className="text-zinc-500 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" /> Analyzed on {format(new Date(report.timestamp!), 'PPP p')}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={handleCopyReport}
            className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 rounded-xl text-sm font-bold transition-all"
          >
            Copy Summary
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-400 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV Export
          </button>
          <button
            onClick={handleExportJson}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
          >
            JSON
          </button>
          <Link to="/" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-sm font-bold transition-colors">
            New Analysis
          </Link>
        </div>
      </div>

      {report.metrics.coldStart?.coldStartDetected && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-amber-400 text-sm mt-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {report.metrics.coldStart.message}
        </div>
      )}

      <div className="grid grid-cols-12 gap-8 mt-8">
        {/* Score Breakdown */}
        <Card className="col-span-12 lg:col-span-4 flex flex-col items-center justify-center space-y-6">
          <h2 className="text-lg font-semibold text-zinc-400">Weighted Score</h2>
          <ScoreCircle score={report.score} />
          {report.metrics.breakdown && (
            <div className="w-full space-y-3 pt-4 border-t border-white/5">
              {[
                { label: 'Latency (40%)', value: report.metrics.breakdown.latencyScore },
                { label: 'Stability (20%)', value: report.metrics.breakdown.stabilityScore },
                { label: 'Payload (15%)', value: report.metrics.breakdown.payloadScore },
                { label: 'Security (15%)', value: report.metrics.breakdown.securityScore },
                { label: 'Throughput (10%)', value: report.metrics.breakdown.throughputScore },
              ].map((b, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                    <span>{b.label}</span>
                    <span>{b.value}/100</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-1000"
                      style={{ width: `${b.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Avg Latency', value: `${report.metrics.avgLatency.toFixed(0)}ms`, icon: Clock, color: 'text-blue-400' },
            { label: 'P95 Latency', value: `${report.metrics.p95Latency.toFixed(0)}ms`, icon: Zap, color: 'text-amber-400' },
            { label: 'Throughput', value: `${report.metrics.throughput} RPS`, icon: Activity, color: 'text-emerald-400' },
            { label: 'Success Rate', value: `${((report.metrics.successful / report.metrics.totalRequests) * 100).toFixed(1)}%`, icon: CheckCircle2, color: 'text-purple-400' },
            { label: 'Min Latency', value: `${report.metrics.minLatency}ms`, icon: ChevronRight, color: 'text-zinc-400' },
            { label: 'Max Latency', value: `${report.metrics.maxLatency}ms`, icon: ChevronRight, color: 'text-zinc-400' },
            { label: 'Avg Payload', value: `${(report.metrics.avgSize / 1024).toFixed(1)}KB`, icon: Database, color: 'text-zinc-400' },
            { label: 'Total Requests', value: report.metrics.totalRequests, icon: Info, color: 'text-zinc-400' },
          ].map((stat, i) => (
            <Card key={i} className="p-4 flex flex-col justify-between">
              <stat.icon className={cn("w-5 h-5 mb-2", stat.color)} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Extended Percentiles */}
        <Card className="col-span-12 lg:col-span-12">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" /> Statistical Percentiles
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {percentileData.map((p, i) => (
              <Card key={i} className="p-4 flex flex-col justify-between">
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">{p.label}</p>
                <p className="text-2xl font-bold text-white">{p.value}</p>
              </Card>
            ))}
          </div>
        </Card>

        {/* Latency Chart */}
        <Card className="col-span-12 lg:col-span-8 h-[400px]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" /> Latency Distribution
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" hide />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `${v}ms`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                itemStyle={{ color: '#10b981' }}
                labelStyle={{ display: 'none' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Availability Pie */}
        <Card className="col-span-12 lg:col-span-4 h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Availability
          </h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={500}
                >
                  {successRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 pb-4">
            {successRateData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-zinc-400">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance Trends */}
        {trends.length > 1 && (
          <Card className="col-span-12 h-[350px]">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" /> Performance Trends
            </h3>
            <div className="h-[250px] w-full">
              <ChartJSLine
                data={{
                  labels: trends.map(t => format(new Date(t.timestamp), 'MMM d, HH:mm')),
                  datasets: [
                    {
                      label: 'Avg Latency (ms)',
                      data: trends.map(t => t.avgLatency),
                      borderColor: '#3b82f6',
                      yAxisID: 'y',
                      tension: 0.4
                    },
                    {
                      label: 'P95 Latency (ms)',
                      data: trends.map(t => t.p95Latency),
                      borderColor: '#60a5fa',
                      borderDash: [5, 5],
                      yAxisID: 'y',
                      tension: 0.4
                    },
                    {
                      label: 'Throughput (RPS)',
                      data: trends.map(t => parseFloat(t.throughput)),
                      borderColor: '#a855f7',
                      yAxisID: 'y1',
                      tension: 0.4
                    },
                    {
                      label: 'Score',
                      data: trends.map(t => t.score),
                      borderColor: '#10b981',
                      borderWidth: 3,
                      yAxisID: 'y1',
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  animation: false,
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  scales: {
                    x: {
                      grid: { color: '#1f2937' },
                      ticks: { color: '#6b7280', maxTicksLimit: 8 }
                    },
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: { display: true, text: 'Latency (ms)', color: '#6b7280' },
                      grid: { color: '#1f2937' }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      title: { display: true, text: 'Score & RPS', color: '#6b7280' },
                      grid: { drawOnChartArea: false }
                    }
                  },
                  plugins: {
                    legend: { labels: { color: '#d4d4d8' } }
                  }
                }}
              />
            </div>
          </Card>
        )}

        {/* Bottleneck Diagnosis */}
        {report.diagnosis && (report.diagnosis.issues.length > 0 || report.diagnosis.recommendations.length > 0) && (
          <Card className="col-span-12 border-amber-500/20 bg-amber-500/5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-5 h-5" /> Performance Diagnosis
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase text-amber-500/60 tracking-wider">Detected Issues</p>
                <ul className="space-y-2">
                  {report.diagnosis.issues.map((issue, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase text-emerald-500/60 tracking-wider">Recommendations</p>
                <ul className="space-y-2">
                  {report.diagnosis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <ArrowRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Optimization Suggestions */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Optimization Suggestions
          </h3>
          <div className="space-y-3">
            {report.suggestions.map((s: string, i: number) => (
              <div key={i} className="glass p-4 rounded-xl flex gap-4 items-start">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{s}</p>
              </div>
            ))}
            {report.suggestions.length === 0 && (
              <div className="glass p-8 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="font-semibold">Perfect Optimization!</p>
                <p className="text-sm text-zinc-500">No major issues detected in this endpoint.</p>
              </div>
            )}
          </div>
        </div>

        {/* Security Audit */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" /> Security Audit
          </h3>
          {report.metrics.securityAudit ? (
            <Card className="p-0 overflow-hidden text-sm">
              <div className="p-4 bg-emerald-500/10 border-b border-white/5 font-semibold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Detected Headers ({report.metrics.securityAudit.detectedHeaders.length})
              </div>
              <ul className="divide-y divide-white/5">
                {report.metrics.securityAudit.detectedHeaders.map(h => (
                  <li key={h} className="px-4 py-2 font-mono text-xs text-zinc-300">{h}</li>
                ))}
                {report.metrics.securityAudit.detectedHeaders.length === 0 && (
                  <li className="px-4 py-2 text-zinc-500 italic">None detected.</li>
                )}
              </ul>

              <div className="p-4 bg-red-500/10 border-y border-white/5 font-semibold text-red-400 flex items-center gap-2 mt-4">
                <AlertCircle className="w-4 h-4" /> Missing Headers ({report.metrics.securityAudit.missingHeaders.length})
              </div>
              <ul className="divide-y divide-white/5">
                {report.metrics.securityAudit.missingHeaders.map(h => (
                  <li key={h} className="px-4 py-2 font-mono text-xs text-zinc-300">{h}</li>
                ))}
                {report.metrics.securityAudit.missingHeaders.length === 0 && (
                  <li className="px-4 py-2 text-emerald-500 italic">All critical headers present!</li>
                )}
              </ul>
            </Card>
          ) : (
            <div className="glass p-8 rounded-xl text-center space-y-2">
              <AlertCircle className="w-12 h-12 text-zinc-500 mx-auto" />
              <p className="font-semibold text-zinc-400">Security audit data unavailable</p>
            </div>
          )}
        </div>

        {/* Performance Cards */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rate Limit Diagnostics */}
          <Card className={cn("p-6", report.rateLimit?.rateLimitDetected ? "border-red-500/30 bg-red-500/5" : "border-white/5")}>
            <h3 className="text-zinc-400 text-sm font-medium mb-4 uppercase tracking-wider italic flex items-center gap-2">
              <ShieldAlert className={cn("w-4 h-4", report.rateLimit?.rateLimitDetected ? "text-red-400" : "text-zinc-500")} />
              Rate Limit Diagnostics
            </h3>
            {report.rateLimit?.rateLimitDetected ? (
              <div className="space-y-4">
                <div className="p-3 bg-red-400/10 rounded-lg border border-red-400/20">
                  <p className="text-red-400 text-sm font-medium">⚠️ Throttling Detected: Multiple HTTP 429 errors occurred during analysis.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Limit</span>
                    <p className="text-xl font-bold font-mono text-zinc-100">{report.rateLimit.limitHeader || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Remaining</span>
                    <p className="text-xl font-bold font-mono text-zinc-100">{report.rateLimit.remaining || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400/20 mb-2" />
                <p className="text-zinc-500 text-sm">No rate limiting detected during this session.</p>
              </div>
            )}
          </Card>

          {/* Payload Efficiency */}
          <Card className="p-6 border-white/5">
            <h3 className="text-zinc-400 text-sm font-medium mb-4 uppercase tracking-wider italic flex items-center gap-2">
              <Archive className="w-4 h-4 text-emerald-400" /> Payload Efficiency
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Average Size</span>
                  <p className="text-2xl font-bold text-zinc-100 italic">{(report.metrics.avgSize / 1024).toFixed(2)} <span className="text-xs text-zinc-400 not-italic">KB</span></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Max Payload</span>
                  <p className="text-lg font-bold text-zinc-300">{(report.payloadAnalysis?.maxSize / 1024).toFixed(2)} KB</p>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                  <span>Efficiency Status</span>
                  <span className={cn(report.metrics.avgSize > 500000 ? "text-red-400" : "text-emerald-400")}>
                    {report.metrics.avgSize > 1000000 ? 'Poor' : report.metrics.avgSize > 300000 ? 'Fair' : 'Excellent'}
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (report.metrics.avgSize / 1000000) * 100)}%` }}
                    className={cn("h-full", report.metrics.avgSize > 500000 ? "bg-red-400" : "bg-emerald-400")}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* PDF Export Floating Button */}
      <div className="fixed bottom-8 right-8 z-[60] print:hidden">
        <button
          onClick={() => window.open(`/api/report/pdf/${report.id}`, '_blank')}
          className="flex items-center gap-2 bg-emerald-500 text-black px-6 py-3 rounded-full font-bold shadow-2xl shadow-emerald-500/40 hover:bg-emerald-400 hover:scale-105 transition-all group"
        >
          <Download className="w-5 h-5 group-hover:bounce" />
          Export Professional PDF
        </button>
      </div>
    </div>
  );
};

const ComparisonView = () => {
  const [apiA, setApiA] = useState<ComparisonRequest>({ url: '', method: 'GET', concurrency: 1, requests: 10 });
  const [apiB, setApiB] = useState<ComparisonRequest>({ url: '', method: 'GET', concurrency: 1, requests: 10 });
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await compareApis(apiA, apiB);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">API Comparison Mode</h1>
        <p className="text-zinc-400">Compare two endpoints side-by-side to determine the performance leader.</p>
      </div>

      {!result ? (
        <Card className="p-8">
          <form onSubmit={handleCompare} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-12">
              {/* API A */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-400">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-xs">A</div>
                  Endpoint A
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <select
                      value={apiA.method}
                      onChange={(e) => setApiA({ ...apiA, method: e.target.value })}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
                    >
                      <option>GET</option><option>POST</option>
                    </select>
                    <input
                      type="url" required placeholder="URL A"
                      value={apiA.url} onChange={(e) => setApiA({ ...apiA, url: e.target.value })}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number" placeholder="Conc"
                      value={apiA.concurrency} onChange={(e) => setApiA({ ...apiA, concurrency: parseInt(e.target.value) })}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm"
                    />
                    <input
                      type="number" placeholder="Reqs"
                      value={apiA.requests} onChange={(e) => setApiA({ ...apiA, requests: parseInt(e.target.value) })}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* API B */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-purple-400">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-xs">B</div>
                  Endpoint B
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <select
                      value={apiB.method}
                      onChange={(e) => setApiB({ ...apiB, method: e.target.value })}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
                    >
                      <option>GET</option><option>POST</option>
                    </select>
                    <input
                      type="url" required placeholder="URL B"
                      value={apiB.url} onChange={(e) => setApiB({ ...apiB, url: e.target.value })}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number" placeholder="Conc"
                      value={apiB.concurrency} onChange={(e) => setApiB({ ...apiB, concurrency: parseInt(e.target.value) })}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm"
                    />
                    <input
                      type="number" placeholder="Reqs"
                      value={apiB.requests} onChange={(e) => setApiB({ ...apiB, requests: parseInt(e.target.value) })}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

            <button
              type="submit" disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Comparison Analysis"}
            </button>
          </form>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <Card className="bg-emerald-500/10 border-emerald-500/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500 rounded-2xl text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-400">Comparison Complete</h2>
                <p className="text-emerald-400/80 text-sm">{result.comparisonSummary}</p>
              </div>
            </div>
            <div className="flex gap-2 print:hidden">
              <button onClick={() => setResult(null)} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors border border-white/5">
                Reset Comparison
              </button>
            </div>
          </Card>

          {/* Radar Chart Visual Comparison */}
          <Card className="p-6" >
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-zinc-300">
              <Activity className="w-5 h-5 text-purple-400" /> Multi-dimensional Analysis
            </h3>
            <div className="h-[350px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%" cy="50%" outerRadius="70%"
                  data={[
                    {
                      subject: 'Latency',
                      A: result.apiA.metrics.breakdown?.latencyScore || 0,
                      B: result.apiB.metrics.breakdown?.latencyScore || 0,
                      fullMark: 100
                    },
                    {
                      subject: 'Stability',
                      A: result.apiA.metrics.breakdown?.stabilityScore || 0,
                      B: result.apiB.metrics.breakdown?.stabilityScore || 0,
                      fullMark: 100
                    },
                    {
                      subject: 'Payload',
                      A: result.apiA.metrics.breakdown?.payloadScore || 0,
                      B: result.apiB.metrics.breakdown?.payloadScore || 0,
                      fullMark: 100
                    },
                    {
                      subject: 'Security',
                      A: result.apiA.metrics.breakdown?.securityScore || 0,
                      B: result.apiB.metrics.breakdown?.securityScore || 0,
                      fullMark: 100
                    },
                    {
                      subject: 'Throughput',
                      A: result.apiA.metrics.breakdown?.throughputScore || 0,
                      B: result.apiB.metrics.breakdown?.throughputScore || 0,
                      fullMark: 100
                    }
                  ]}
                >
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#52525b' }} stroke="#27272a" />
                  <Radar name="API A" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Radar name="API B" dataKey="B" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs text-zinc-400">Endpoint A</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /><span className="text-xs text-zinc-400">Endpoint B</span></div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { id: 'apiA', data: result.apiA, color: 'blue' },
              { id: 'apiB', data: result.apiB, color: 'purple' }
            ].map((api, index) => (
              <motion.div
                key={api.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (index * 0.1) }}
                className={cn(
                  "space-y-4 relative transition-all duration-500",
                  result.winner === api.id && "ring-2 ring-emerald-500 rounded-3xl p-1 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                )}
              >
                {result.winner === api.id && (
                  <div className="absolute -top-3 -right-3 bg-emerald-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> WINNER
                  </div>
                )}
                <Card className={cn("p-6", result.winner === api.id && "bg-emerald-500/5")} >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg", `bg-${api.color}-500/20 text-${api.color}-400 border border-${api.color}-500/30`)}>
                        {api.id === 'apiA' ? 'A' : 'B'}
                      </div>
                      <h3 className="font-mono text-sm font-bold truncate max-w-[200px]">{api.data.url}</h3>
                    </div>
                    <Badge variant={api.data.grade === 'A' ? 'success' : 'default'}>Grade {api.data.grade}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:bg-zinc-800/50 transition-colors">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Avg Latency</p>
                      <p className="text-2xl font-bold">{api.data.metrics.avgLatency.toFixed(0)}<span className="text-sm font-normal text-zinc-500">ms</span></p>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:bg-zinc-800/50 transition-colors">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">P95 Latency</p>
                      <p className="text-2xl font-bold">{api.data.metrics.p95Latency.toFixed(0)}<span className="text-sm font-normal text-zinc-500">ms</span></p>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:bg-zinc-800/50 transition-colors">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Throughput</p>
                      <p className="text-2xl font-bold">{api.data.metrics.throughput} <span className="text-sm font-normal text-zinc-500">RPS</span></p>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:bg-zinc-800/50 transition-colors">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Stability</p>
                      <p className="text-2xl font-bold">{((api.data.metrics.successful / api.data.metrics.totalRequests) * 100).toFixed(1)}<span className="text-sm font-normal text-zinc-500">%</span></p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-xs font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Score Breakdown</p>
                    <div className="space-y-3">
                      {api.data.metrics.breakdown && Object.entries(api.data.metrics.breakdown).map(([key, val]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                            <span>{key.replace('Score', '')}</span>
                            <span>{val}/100</span>
                          </div>
                          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={cn("h-full", `bg-${api.color}-500`)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const AnalyticsView = () => {
  const [history, setHistory] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then(setHistory).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  const totalTests = history.length;
  const avgScore = history.reduce((acc, curr) => acc + curr.score, 0) / (totalTests || 1);
  const avgLatency = history.reduce((acc, curr) => acc + (curr.metrics?.avgLatency || 0), 0) / (totalTests || 1);
  const totalSuccessful = history.reduce((acc, curr) => acc + (curr.metrics?.successful || 0), 0);
  const totalRequests = history.reduce((acc, curr) => acc + (curr.metrics?.totalRequests || 0), 0);
  const successRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 0;

  const methodDistribution = history.reduce((acc, curr) => {
    acc[curr.method] = (acc[curr.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const methodData = Object.entries(methodDistribution).map(([name, value]) => ({ name, value }));
  const trendData = history.slice(-20).map(h => ({
    name: format(new Date(h.timestamp!), 'MMM d'),
    score: h.score,
    latency: h.metrics?.avgLatency || 0
  }));

  const COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">Project Analytics</h1>
          <p className="text-zinc-500 mt-1">Global performance overview across {totalTests} tests.</p>
        </div>
        <Link to="/" className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-sm font-bold transition-all">
          Run New Test
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Analyzed', value: totalTests, icon: Activity, color: 'text-emerald-400' },
          { label: 'Avg Fleet Score', value: `${avgScore.toFixed(1)}%`, icon: Zap, color: 'text-blue-400' },
          { label: 'Fleet Latency', value: `${avgLatency.toFixed(0)}ms`, icon: Clock, color: 'text-purple-400' },
          { label: 'Overall Stability', value: `${successRate.toFixed(1)}%`, icon: Shield, color: 'text-amber-400' },
        ].map((s, i) => (
          <Card key={i} className="p-6">
            <s.icon className={cn("w-6 h-6 mb-4", s.color)} />
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <Card className="col-span-12 lg:col-span-8 h-[400px]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <BarChartIcon className="w-5 h-5 text-blue-400" /> Performance Trends (Last 20)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4 h-[400px]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" /> Method Mix
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methodData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5} dataKey="value"
                >
                  {methodData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {methodData.map((m, i) => (
              <div key={m.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-zinc-500 font-bold uppercase">{m.name} ({m.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const HistoryView = () => {
  const [history, setHistory] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then(setHistory).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analysis History</h1>
        <Link to="/" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-sm font-bold transition-colors">
          New Analysis
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.length > 0 ? history.map((report) => (
          <Link key={report.id} to={`/report/${report.id}`}>
            <Card className="p-4 hover:bg-white/10 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                    report.score >= 90 ? "bg-emerald-500/10 text-emerald-400" :
                      report.score >= 75 ? "bg-blue-500/10 text-blue-400" :
                        report.score >= 60 ? "bg-amber-500/10 text-amber-400" :
                          "bg-red-500/10 text-red-400"
                  )}>
                    {report.score}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge>{report.method}</Badge>
                      <h3 className="font-mono text-sm font-semibold truncate max-w-md">{report.url}</h3>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {format(new Date(report.timestamp!), 'PP p')} • {report.metrics.avgLatency.toFixed(0)}ms avg • {report.metrics.throughput} RPS
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>
        )) : (
          <div className="text-center py-20 glass rounded-2xl space-y-4">
            <History className="w-16 h-16 text-zinc-700 mx-auto" />
            <p className="text-zinc-500">No analysis history yet.</p>
            <Link to="/" className="inline-block text-emerald-400 hover:underline">Start your first analysis</Link>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Layout ---

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      id="app-layout"
      className="text-zinc-100 flex flex-col relative min-h-screen overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 relative z-10 animate-in fade-in duration-700">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  return (
    <>
      <TopNav />
      <Layout>
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/uptime" element={<UptimeView />} />
          <Route path="/compare" element={<ComparisonView />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/report/:id" element={<ReportView />} />
        </Routes>
      </Layout>
    </>
  );
}

// --- NEW: Uptime Monitor View ---
function UptimeView() {
  const [uptimeData, setUptimeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');

  const fetchUptime = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/uptime?url=${url}`);
      setUptimeData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent italic">
          Availability Monitor
        </h1>
        <p className="text-zinc-400">Track real-time uptime and incident history for your API endpoints.</p>
      </div>

      <Card className="flex gap-4 p-4">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter API URL to check uptime..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 transition-colors"
        />
        <button onClick={fetchUptime} className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-2">
          <Search className="w-4 h-4" /> Check
        </button>
      </Card>

      {uptimeData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <h3 className="text-zinc-400 text-sm font-medium mb-4 uppercase tracking-wider italic">Uptime Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-emerald-400">{uptimeData.uptimePercentage}%</span>
              <span className="text-zinc-500 text-sm font-medium">Availability</span>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-zinc-400 text-sm font-medium mb-4 uppercase tracking-wider italic">Last Downtime</h3>
            <div className="text-2xl font-semibold text-zinc-100">
              {uptimeData.lastDowntime ? new Date(uptimeData.lastDowntime).toLocaleString() : 'No downtime detected'}
            </div>
          </Card>

          <Card className="col-span-full p-6">
            <h3 className="text-zinc-400 text-sm font-medium mb-4 uppercase tracking-wider italic">Incident Logs</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {uptimeData.logs.map((log: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", log.success ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-red-400 shadow-sm shadow-red-400/50")} />
                    <span className="text-sm font-medium text-zinc-300">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold font-mono text-zinc-500">{log.latency}ms</span>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase", log.success ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400")}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
