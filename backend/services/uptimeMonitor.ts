import cron from 'node-cron';
import axios from 'axios';
import Database from 'better-sqlite3';

const db = new Database("apoa.db");

// Initialize uptime table
db.exec(`
  CREATE TABLE IF NOT EXISTS uptime_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status INTEGER,
    latency INTEGER,
    success BOOLEAN
  )
`);

export const startUptimeMonitor = (url: string) => {
    console.log(`Starting uptime monitor for: ${url}`);

    // Schedule a ping every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        const start = Date.now();
        try {
            const response = await axios.get(url, { timeout: 5000, validateStatus: () => true });
            const latency = Date.now() - start;
            const success = response.status >= 200 && response.status < 400;

            const stmt = db.prepare(`
        INSERT INTO uptime_logs (url, status, latency, success)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(url, response.status, latency, success ? 1 : 0);
        } catch (error: any) {
            const stmt = db.prepare(`
        INSERT INTO uptime_logs (url, status, latency, success)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(url, 0, Date.now() - start, 0);
        }
    });
};

export const getUptimeStats = (url: string) => {
    const logs = db.prepare("SELECT * FROM uptime_logs WHERE url = ? ORDER BY timestamp DESC LIMIT 100").all(url);
    const total = logs.length;
    if (total === 0) return { uptimePercentage: 100, lastDowntime: null, logs: [] };

    const successful = logs.filter((l: any) => l.success).length;
    const uptimePercentage = (successful / total) * 100;
    const lastDowntimeRow: any = logs.find((l: any) => !l.success);

    return {
        uptimePercentage: Math.round(uptimePercentage * 10) / 10,
        lastDowntime: lastDowntimeRow ? lastDowntimeRow.timestamp : null,
        logs
    };
};
