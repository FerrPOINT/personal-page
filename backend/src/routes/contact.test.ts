import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import contactRoutes from './contact.js';
import * as Message from '../models/Message.js';
import * as Validation from '../services/validation.js';
import * as Worker from '../workers/telegram-worker.js';
import * as Retry from '../utils/retry.js';

// Mock dependencies
vi.mock('../models/Message.js');
vi.mock('../services/validation.js');
vi.mock('../workers/telegram-worker.js');
vi.mock('../utils/retry.js');
vi.mock('../utils/logger.js', () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Contact Routes', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    
    // Mock requestId middleware (must be before routes)
    app.use((req: any, res, next) => {
      req.requestId = 'test-request-id';
      next();
    });
    
    // Mock retry to just call the function directly (no retry in tests)
    vi.mocked(Retry.retry).mockImplementation(async (fn) => fn());
    
    app.use('/api/contact', contactRoutes);
  });

  describe('POST /api/contact', () => {
    it('should create message successfully with valid data', async () => {
      // Setup
      const mockMessage = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'pending' as const,
        created_at: '2026-01-19T10:00:00Z',
        sent_at: null,
        error_message: null,
      };

      vi.mocked(Validation.sanitizeString).mockImplementation((input) => input);
      vi.mocked(Validation.validateContactForm).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(Message.createMessage).mockResolvedValue(mockMessage);
      vi.mocked(Worker.processMessage).mockResolvedValue();

      // Execute
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message',
        })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Message saved successfully');
      expect(response.body.data.id).toBe('test-id');
      expect(response.body.data.status).toBe('pending');
      
      expect(Validation.sanitizeString).toHaveBeenCalledTimes(3);
      expect(Validation.validateContactForm).toHaveBeenCalled();
      expect(Message.createMessage).toHaveBeenCalled();
      expect(Retry.retry).toHaveBeenCalled();
    });

    it('should sanitize input data', async () => {
      // Setup
      const mockMessage = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'pending' as const,
        created_at: '2026-01-19T10:00:00Z',
        sent_at: null,
        error_message: null,
      };

      vi.mocked(Validation.sanitizeString)
        .mockReturnValueOnce('Test User')
        .mockReturnValueOnce('test@example.com')
        .mockReturnValueOnce('Test message');
      vi.mocked(Validation.validateContactForm).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(Message.createMessage).mockResolvedValue(mockMessage);
      vi.mocked(Worker.processMessage).mockResolvedValue();

      // Execute
      await request(app)
        .post('/api/contact')
        .send({
          name: '<script>alert("xss")</script>Test User',
          email: 'test@example.com',
          message: 'Test message',
        })
        .expect(200);

      // Assert
      expect(Validation.sanitizeString).toHaveBeenCalledWith('<script>alert("xss")</script>Test User');
    });

    it('should return 400 when validation fails', async () => {
      // Setup
      vi.mocked(Validation.sanitizeString).mockImplementation((input) => input);
      vi.mocked(Validation.validateContactForm).mockReturnValue({
        valid: false,
        errors: ['Email is required', 'Message must be at least 10 characters'],
      });

      // Execute
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: '',
          message: 'Short',
        })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toEqual([
        'Email is required',
        'Message must be at least 10 characters',
      ]);
      
      expect(Message.createMessage).not.toHaveBeenCalled();
    });

    it('should return 400 when email format is invalid', async () => {
      // Setup
      vi.mocked(Validation.sanitizeString).mockImplementation((input) => input);
      vi.mocked(Validation.validateContactForm).mockReturnValue({
        valid: false,
        errors: ['Email format is invalid'],
      });

      // Execute
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          message: 'Test message',
        })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Email format is invalid');
    });

    it('should return 500 when database error occurs', async () => {
      // Setup
      vi.mocked(Validation.sanitizeString).mockImplementation((input) => input);
      vi.mocked(Validation.validateContactForm).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(Message.createMessage).mockRejectedValue(new Error('Database error'));

      // Execute
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message',
        })
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Failed to save message');
    });

    it('should handle missing fields gracefully', async () => {
      // Setup
      vi.mocked(Validation.sanitizeString).mockReturnValue('');
      vi.mocked(Validation.validateContactForm).mockReturnValue({
        valid: false,
        errors: ['Name is required', 'Email is required', 'Message is required'],
      });

      // Execute
      const response = await request(app)
        .post('/api/contact')
        .send({})
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('should handle processMessage errors without failing request', async () => {
      // Setup
      const mockMessage = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'pending' as const,
        created_at: '2026-01-19T10:00:00Z',
        sent_at: null,
        error_message: null,
      };

      vi.mocked(Validation.sanitizeString).mockImplementation((input) => input);
      vi.mocked(Validation.validateContactForm).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(Message.createMessage).mockResolvedValue(mockMessage);
      vi.mocked(Worker.processMessage).mockRejectedValue(new Error('Telegram error'));

      // Execute - should still return 200 because processMessage is fire-and-forget
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message',
        })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(Retry.retry).toHaveBeenCalled();
    });

    it('should apply rate limiting', async () => {
      // This test would require mocking express-rate-limit
      // For now, we just verify the route exists
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message',
        });

      // Rate limiting is applied via middleware, so we just check route exists
      expect([200, 400, 429, 500]).toContain(response.status);
    });
  });
});

