import { Request, Response, NextFunction } from 'express';
import { AnalysisService } from '../services/analysis.service.js';
import { HistoryRepository } from '../repositories/history.repo.js';
import { startUptimeMonitor } from '../services/uptimeMonitor.js';

export const AnalysisController = {
    analyze: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { url, method, concurrency, requests } = req.body;
            
            // 1. Run the heavy analysis (Service Layer)
            const report = await AnalysisService.runAnalysis(url, method, concurrency, requests, req.body);
            
            // 2. Save result to DB (Repository Layer)
            const id = HistoryRepository.saveReport(report);

            // 3. Start monitoring in background
            startUptimeMonitor(url);

            // 4. Return formatted response (the idempotency middleware will intercept and cache this)
            res.status(200).json({ 
                id, 
                ...report, 
                metrics: report.metrics, 
                suggestions: report.suggestions 
            });
        } catch (error) {
            next(error); // Passes the error to the global errorHandler
        }
    }
};
