import { Router, type NextFunction, type Request, type Response, type Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import { createMessage } from '../models/Message.js';
import { sanitizeString, validateContactForm } from '../services/validation.js';
import { DuplicateError } from '../utils/errors.js';

const router: ExpressRouter = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Слишком много запросов. Попробуйте позже.' },
    requestId: req.requestId,
  }),
});

router.post('/', contactLimiter, async (req: Request, res: Response, next: NextFunction) => {
  const formData = {
    name: sanitizeString(req.body?.name),
    email: sanitizeString(req.body?.email),
    message: sanitizeString(req.body?.message),
  };
  const validation = validateContactForm(formData);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Проверьте заполненные поля', fields: validation.errors },
      requestId: req.requestId,
    });
  }

  try {
    const message = await createMessage(formData);
    return res.status(202).json({ success: true, data: { id: message.id, status: 'pending' } });
  } catch (error) {
    if (error instanceof DuplicateError) {
      return res.status(409).json({
        success: false,
        error: { code: error.code, message: error.message },
        requestId: req.requestId,
      });
    }
    next(error);
  }
});

export default router;
