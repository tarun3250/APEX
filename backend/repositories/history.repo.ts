import { db } from '../config/database.js';

export const HistoryRepository = {
    saveReport: (report: any) => {
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
        return info.lastInsertRowid;
    },

    getRecentHistory: (limit = 50) => {
        return db.prepare("SELECT * FROM history ORDER BY timestamp DESC LIMIT ?").all(limit);
    },

    getTrends: (url: string) => {
        return db.prepare(`
            SELECT timestamp, score, metrics 
            FROM history 
            WHERE url = ? 
            ORDER BY timestamp ASC
        `).all(url);
    },

    getReportById: (id: string | number) => {
        return db.prepare("SELECT * FROM history WHERE id = ?").get(id);
    }
};
