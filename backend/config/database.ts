import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../../apoa.db");

// Export a single, shared database connection
export const db = new Database(dbPath);

export const initializeDatabase = () => {
    // History Table (Core Metrics)
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

    // Uptime Logs Table (from uptimeMonitor.ts)
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

    // Idempotency Cache Table (New)
    db.exec(`
        CREATE TABLE IF NOT EXISTS idempotency_cache (
            key TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            response TEXT,
            expires_at DATETIME NOT NULL
        )
    `);
};
