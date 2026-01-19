import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Request ID middleware for request tracing (best practice 2026)
 * Generates unique request ID for each request and adds it to logs
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Use existing request ID from header (for distributed tracing) or generate new one
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Add request ID to response header for client tracking
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
}

