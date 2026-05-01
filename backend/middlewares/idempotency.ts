import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';

export const requireIdempotency = (req: Request, res: Response, next: NextFunction) => {
    const idempotencyKey = req.headers['x-idempotency-key'];

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
        return res.status(400).json({ status: 'error', message: 'x-idempotency-key header is required' });
    }

    // 1. Check if key exists
    const existingRecord: any = db.prepare('SELECT * FROM idempotency_cache WHERE key = ?').get(idempotencyKey);

    if (existingRecord) {
        if (existingRecord.status === 'PROCESSING') {
            return res.status(409).json({ status: 'error', message: 'Request is already processing' });
        }
        return res.status(200).json(JSON.parse(existingRecord.response));
    }

    // 2. Mark as processing with 24-hour expiry
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO idempotency_cache (key, status, expires_at) VALUES (?, ?, ?)').run(idempotencyKey, 'PROCESSING', expiryDate);

    // 3. Intercept res.json
    const originalJson = res.json.bind(res);
    
    // Override the express json method to catch the response before it sends
    (res as any).json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            db.prepare('UPDATE idempotency_cache SET status = ?, response = ? WHERE key = ?')
                .run('COMPLETED', JSON.stringify(body), idempotencyKey);
        } else {
            db.prepare('DELETE FROM idempotency_cache WHERE key = ?').run(idempotencyKey);
        }
        return originalJson(body);
    };

    next();
};
