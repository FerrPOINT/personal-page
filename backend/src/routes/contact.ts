import { Router, Request, Response } from 'express';
import { createMessage } from '../models/Message.js';
import { validateContactForm, sanitizeString } from '../services/validation.js';
import { processMessage } from '../workers/telegram-worker.js';

const router = Router();

/**
 * POST /api/contact
 * Create a new contact form message
 */
router.post('/', async (req: Request, res: Response) => {
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

    // Create message in database
    const message = await createMessage(formData);

    // Process message immediately (send to Telegram)
    // Don't wait for worker interval - send right away
    processMessage(message).catch(error => {
      console.error(`❌ Error processing message ${message.id} immediately:`, error);
      // Don't fail the request if Telegram send fails - message is already saved
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
  } catch (error) {
    console.error('❌ Error creating message:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to save message',
    });
  }
});

export default router;

