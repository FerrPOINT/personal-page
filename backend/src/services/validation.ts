import validator from 'validator';
const { isEmail } = validator;

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ContactFormData, string>>;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

/**
 * Validate contact form data
 */
export function validateContactForm(data: ContactFormData): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  // Validate name
  if (!data.name || typeof data.name !== 'string') {
    errors.name = 'Укажите имя';
  } else if (data.name.trim().length === 0) {
    errors.name = 'Укажите имя';
  } else if (data.name.length > 255) {
    errors.name = 'Имя должно быть не длиннее 255 символов';
  }

  // Validate email
  if (!data.email || typeof data.email !== 'string') {
    errors.email = 'Укажите email';
  } else if (data.email.trim().length === 0) {
    errors.email = 'Укажите email';
  } else if (data.email.length > 255) {
    errors.email = 'Email должен быть не длиннее 255 символов';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Некорректный email';
  }

  // Validate message
  if (!data.message || typeof data.message !== 'string') {
    errors.message = 'Введите сообщение';
  } else if (data.message.trim().length === 0) {
    errors.message = 'Введите сообщение';
  } else if (data.message.length > 5000) {
    errors.message = 'Сообщение должно быть не длиннее 5000 символов';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate email format using validator.js library
 * Uses RFC 5322 compliant validation with proper domain checking
 */
function isValidEmail(email: string): boolean {
  // Normalize email: trim and convert to lowercase for validation
  const normalizedEmail = email.trim().toLowerCase();
  
  // Use validator.js for robust email validation
  // This checks:
  // - Proper format according to RFC 5322
  // - Valid domain structure (must have TLD)
  // - No invalid characters
  return isEmail(normalizedEmail, {
    allow_utf8_local_part: true,
    require_tld: true, // Require top-level domain (e.g., .com, .org)
    allow_ip_domain: false, // Don't allow IP addresses as domains
    domain_specific_validation: true, // Additional domain validation
  });
}

/**
 * Sanitize string input (basic XSS protection)
 * Removes HTML tags and dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove HTML tags (basic protection)
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove potentially dangerous characters for SQL/script injection
  // But keep normal punctuation for messages
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  
  return sanitized;
}

