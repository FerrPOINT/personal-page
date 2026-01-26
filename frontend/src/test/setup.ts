import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.Telegram for tests (configurable so it can be overridden in tests)
Object.defineProperty(window, 'Telegram', {
  writable: true,
  configurable: true,
  value: {
    WebApp: {
      openTelegramLink: vi.fn(),
      openLink: vi.fn(),
      ready: vi.fn(),
      expand: vi.fn(),
      close: vi.fn(),
      sendData: vi.fn(),
      version: '6.0',
      platform: 'web',
      colorScheme: 'light' as const,
      themeParams: {},
    },
  },
});

// Mock navigator.clipboard only if not already defined by userEvent
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    configurable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
}

// Mock window.open
window.open = vi.fn();

// Mock document.execCommand for fallback copy method
Object.defineProperty(document, 'execCommand', {
  writable: true,
  configurable: true,
  value: vi.fn().mockReturnValue(true),
});

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: {
    VITE_TELEGRAM_USERNAME: 'test_username',
  },
}));

