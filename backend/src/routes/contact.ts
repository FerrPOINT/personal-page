import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { createMessage } from '../models/Message.js';
import { validateContactForm, sanitizeString } from '../services/validation.js';
import { processMessage } from '../workers/telegram-worker.js';
import { apiLogger } from '../utils/logger.js';
import { retry } from '../utils/retry.js';
import { isAppError, DuplicateError, toAppError } from '../utils/errors.js';

const router = Router();

// Rate limiting: 5 requests per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many contact form submissions from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * POST /api/contact
 * Create a new contact form message
 */
router.post('/', contactLimiter, async (req: Request, res: Response) => {
  try {
    // Extract and sanitize input
    const formData = {
      name: sanitizeString(req.body.name || ''),
      email: sanitizeString(req.body.email || ''),
      message: sanitizeString(req.body.message || ''),
    };

    // Validate input
    const validation = validateContactForm(formData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    // Create message in database (includes duplicate check)
    let message;
    try {
      message = await createMessage(formData);
    } catch (error: unknown) {
      // Handle duplicate message error specifically
      if (error instanceof DuplicateError) {
        return res.status(error.statusCode).json({
          success: false,
          error: 'Duplicate message',
          message: error.message,
        });
      }
      // Re-throw other errors to be handled by global error handler
      throw error;
    }

    // Process message with retry mechanism (fire-and-forget)
    retry(
      () => processMessage(message),
      {
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 2,
        onRetry: (attempt, error) => {
          apiLogger.warn('Retrying message processing', {
            requestId: req.requestId,
            messageId: message.id,
            attempt,
            error: error.message,
          });
        },
      }
    ).catch(error => {
      apiLogger.error('Failed to process message after retries', {
        requestId: req.requestId,
        messageId: message.id,
        error: error.message,
        stack: error.stack,
      });
      // Message will be processed by worker later
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Message saved successfully',
      data: {
        id: message.id,
        status: message.status,
      },
    });
  } catch (error: unknown) {
    const appError = toAppError(error);
    apiLogger.error('Error creating message', { 
      requestId: req.requestId,
      error: appError.message,
      code: appError.code,
      stack: appError.stack 
    });
    
    // Return appropriate status code based on error type
    const statusCode = isAppError(error) ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: isAppError(error) ? error.code : 'Internal server error',
      message: process.env.NODE_ENV === 'production' 
        ? 'Failed to save message' 
        : appError.message,
    });
  }
});

export default router;

