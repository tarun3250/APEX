import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${err.name}: ${err.message}`);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
    }

    // Catch generic validation/DB errors that aren't wrapped yet
    if (err.name === 'ZodError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: err.errors
        });
    }

    // Fallback
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error'
    });
};
