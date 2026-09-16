import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';

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
  const header = req.headers['x-request-id'];
  const incomingRequestId = Array.isArray(header) ? header[0] : header;
  const isUuid = incomingRequestId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(incomingRequestId);
  req.requestId = isUuid ? incomingRequestId : randomUUID();
  
  // Add request ID to response header for client tracking
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
}

