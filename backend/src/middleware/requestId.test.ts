import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from './requestId.js';

describe('requestIdMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should generate a new request ID when header is not present', () => {
    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockRequest.requestId).toBeDefined();
    expect(typeof mockRequest.requestId).toBe('string');
    expect(mockRequest.requestId!.length).toBeGreaterThan(0);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', mockRequest.requestId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use existing request ID from header', () => {
    const existingId = 'existing-request-id-123';
    mockRequest.headers = { 'x-request-id': existingId };

    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockRequest.requestId).toBe(existingId);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should generate UUID format request ID', () => {
    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // UUID v4 format: 8-4-4-4-12 hex characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(mockRequest.requestId).toMatch(uuidRegex);
  });

  it('should call next() exactly once', () => {
    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});

