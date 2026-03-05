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
  Globe,
  Clock,
  Database,
  ChevronRight,
  Info
} from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
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
  BarChart, Bar, Cell, PieChart, Pie
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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Card = ({ children, className, ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div className={cn("glass rounded-2xl p-6", className)} {...props}>
    {children}
  </div>
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

// --- Pages ---

const Dashboard = () => {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [concurrency, setConcurrency] = useState(5);
  const [requests, setRequests] = useState(50);
  const [simulateSlowNetwork, setSimulateSlowNetwork] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const report = await analyzeApi(url, method, concurrency, requests, simulateSlowNetwork);
      navigate(`/report/${report.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          APEX Performance Advisor
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          API Performance Evaluation & Examination. Analyze latency, payload size, and security headers with automated optimization recommendations.
        </p>
      </div>

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

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
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

      <div className="grid grid-cols-3 gap-6">
        <Card className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold">Latency Analysis</h3>
          <p className="text-xs text-zinc-500">P95, Median, and Average response times.</p>
        </Card>
        <Card className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-semibold">Security Audit</h3>
          <p className="text-xs text-zinc-500">HSTS, CSP, and CORS header validation.</p>
        </Card>
        <Card className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-semibold">Load Simulation</h3>
          <p className="text-xs text-zinc-500">Throughput and error rate under stress.</p>
        </Card>
      </div>
    </div>
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

  const latencyData = report.metrics.latencyDistribution.map((l, i) => ({ name: i, value: l }));
  const successRateData = [
    { name: 'Success', value: report.metrics.successful, color: '#10b981' },
    { name: 'Failed', value: report.metrics.failed, color: '#ef4444' },
  ];

  const percentileData = [
    { label: 'P50 (Median)', value: `${report.metrics.p50}ms` },
    { label: 'P75', value: `${report.metrics.p75}ms` },
    { label: 'P90', value: `${report.metrics.p90}ms` },
    { label: 'P95', value: `${report.metrics.p95}ms` },
    { label: 'P99', value: `${report.metrics.p99}ms` },
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
        <div className="flex gap-2">
          <button
            onClick={handleExportJson}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
          >
            Export PDF
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
              <div key={i} className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">{p.label}</p>
                <p className="text-2xl font-bold text-white">{p.value}</p>
              </div>
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
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Request Timeline Visualization (Chart.js) */}
        {report.metrics.latencyTimeline && report.metrics.latencyTimeline.length > 0 && (
          <Card className="col-span-12 lg:col-span-12 h-[300px]">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" /> Request Timeline
            </h3>
            <div className="h-[200px] w-full">
              <ChartJSLine
                data={{
                  labels: report.metrics.latencyTimeline.map((_, i) => `Req ${i + 1}`),
                  datasets: [
                    {
                      label: 'Latency (ms)',
                      data: report.metrics.latencyTimeline,
                      borderColor: '#a855f7',
                      backgroundColor: 'rgba(168, 85, 247, 0.1)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4,
                      pointRadius: 0,
                      pointHoverRadius: 4
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { display: false },
                    y: {
                      grid: { color: '#1f2937' },
                      border: { dash: [4, 4] }
                    }
                  },
                  plugins: { legend: { display: false } }
                }}
              />
            </div>
          </Card>
        )}

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

        <div className="col-span-12 lg:col-span-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Optimization Suggestions
          </h3>
          {report.suggestions.length > 0 ? (
            <div className="space-y-3">
              {report.suggestions.map((s, i) => (
                <div key={i} className="glass p-4 rounded-xl flex gap-4 items-start">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass p-8 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="font-semibold">Perfect Optimization!</p>
              <p className="text-sm text-zinc-500">No major issues detected in this endpoint.</p>
            </div>
          )}
        </div>

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

        <div className="col-span-12 lg:col-span-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" /> Header Diagnostics
          </h3>
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-zinc-400 font-medium">
                <tr>
                  <th className="px-4 py-3">Header</th>
                  <th className="px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Object.entries(report.headers).slice(0, 10).map(([k, v]) => (
                  <tr key={k} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{k}</td>
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-[200px]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 text-center bg-white/5">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Showing top 10 headers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComparisonView = () => {
  const [apiA, setApiA] = useState({ url: '', method: 'GET', concurrency: 5, requests: 50 });
  const [apiB, setApiB] = useState({ url: '', method: 'GET', concurrency: 5, requests: 50 });
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
        <div className="space-y-8">
          <Card className="bg-emerald-500/10 border-emerald-500/20 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500 rounded-2xl text-black">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Comparison Complete</h2>
                <p className="text-emerald-400/80 text-sm">{result.comparisonSummary}</p>
              </div>
            </div>
            <button onClick={() => setResult(null)} className="text-zinc-400 hover:text-white text-sm font-medium">Reset</button>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { id: 'apiA', data: result.apiA, color: 'blue' },
              { id: 'apiB', data: result.apiB, color: 'purple' }
            ].map((api) => (
              <div key={api.id} className={cn(
                "space-y-4 relative",
                result.winner === api.id && "ring-2 ring-emerald-500 rounded-3xl p-1"
              )}>
                {result.winner === api.id && (
                  <div className="absolute -top-3 -right-3 bg-emerald-500 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10">WINNER</div>
                )}
                <Card className={cn("p-6", result.winner === api.id && "bg-emerald-500/5")}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold", `bg-${api.color}-500/10 text-${api.color}-400`)}>
                        {api.id === 'apiA' ? 'A' : 'B'}
                      </div>
                      <h3 className="font-mono text-sm font-bold truncate max-w-[200px]">{api.data.url}</h3>
                    </div>
                    <Badge variant={api.data.grade === 'A' ? 'success' : 'default'}>Grade {api.data.grade}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Avg Latency</p>
                      <p className="text-xl font-bold">{api.data.metrics.avgLatency.toFixed(0)}ms</p>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">P95 Latency</p>
                      <p className="text-xl font-bold">{api.data.metrics.p95Latency.toFixed(0)}ms</p>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Throughput</p>
                      <p className="text-xl font-bold">{api.data.metrics.throughput} RPS</p>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Stability</p>
                      <p className="text-xl font-bold">{((api.data.metrics.successful / api.data.metrics.totalRequests) * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5">
                    <p className="text-xs font-bold text-zinc-500 uppercase mb-4">Score Breakdown</p>
                    <div className="space-y-3">
                      {api.data.metrics.breakdown && Object.entries(api.data.metrics.breakdown).map(([key, val]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                            <span>{key.replace('Score', '')}</span>
                            <span>{val}/100</span>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
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

      <div className="grid gap-4">
        {history.length > 0 ? history.map((h) => (
          <Link key={h.id} to={`/report/${h.id}`}>
            <Card className="p-4 hover:bg-white/10 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                    h.score >= 90 ? "bg-emerald-500/10 text-emerald-400" :
                      h.score >= 75 ? "bg-blue-500/10 text-blue-400" :
                        h.score >= 60 ? "bg-amber-500/10 text-amber-400" :
                          "bg-red-500/10 text-red-400"
                  )}>
                    {h.score}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge>{h.method}</Badge>
                      <h3 className="font-mono text-sm font-semibold truncate max-w-md">{h.url}</h3>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {format(new Date(h.timestamp!), 'PP p')} • {h.metrics.avgLatency.toFixed(0)}ms avg • {h.metrics.throughput} RPS
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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col p-6 space-y-8 shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight">APEX</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
            <Activity className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link to="/compare" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
            <Zap className="w-5 h-5" />
            <span className="font-medium">Comparison</span>
          </Link>
          <Link to="/history" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
            <History className="w-5 h-5" />
            <span className="font-medium">History</span>
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium">Analyzer Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/compare" element={<ComparisonView />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/report/:id" element={<ReportView />} />
        </Routes>
      </Layout>
    </Router>
  );
}
