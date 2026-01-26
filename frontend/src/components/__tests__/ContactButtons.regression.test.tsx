/**
 * Регрессионные тесты для всех компонентов контактов
 * Проверяет, что все недавно добавленные компоненты работают корректно
 * и не ломают существующий функционал
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TelegramContactButton from '../TelegramContactButton';
import EmailContactButton from '../EmailContactButton';
import PhoneContactButton from '../PhoneContactButton';

// Mock useLanguage hook
vi.mock('../../i18n/hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'contact.telegram.label': 'Telegram',
        'contact.email': 'Email',
        'contact.phone': 'Phone',
        'contact.telegram.copyTooltip': 'Copy username',
        'contact.telegram.copied': 'Copied!',
      };
      return translations[key] || key;
    },
  }),
}));

describe('Contact Buttons Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: { writeText: writeTextMock },
    });
    // Mock window.open
    window.open = vi.fn();
    // Mock Telegram Web App API
    (window as any).Telegram = undefined;
  });

  describe('TelegramContactButton', () => {
    it('should render and display username correctly', () => {
      render(<TelegramContactButton username="test_user" />);
      expect(screen.getByText('Telegram')).toBeInTheDocument();
      expect(screen.getByText('@test_user')).toBeInTheDocument();
    });

    it('should copy username without triggering main action', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>) = writeTextMock;
      
      render(<TelegramContactButton username="test_user" />);
      
      const copyButton = screen.getByRole('button', { name: /copy username/i });
      await user.click(copyButton);
      
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('@test_user');
      });
      
      // Main action should not be triggered
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should open Telegram link when main area is clicked', async () => {
      const user = userEvent.setup();
      render(<TelegramContactButton username="test_user" />);
      
      const contactCard = screen.getByLabelText('Telegram contact');
      await user.click(contactCard);
      
      expect(window.open).toHaveBeenCalled();
    });
  });

  describe('EmailContactButton', () => {
    it('should render and display email correctly', () => {
      render(<EmailContactButton email="test@example.com" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should have correct mailto link', () => {
      render(<EmailContactButton email="test@example.com" />);
      const link = screen.getByLabelText('Email test@example.com');
      expect(link).toHaveAttribute('href', 'mailto:test@example.com');
    });

    it('should copy email without triggering mailto link', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>) = writeTextMock;
      
      // Mock window.location to detect navigation
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as Location;
      
      render(<EmailContactButton email="test@example.com" />);
      
      const copyButton = screen.getByRole('button', { name: /copy username/i });
      await user.click(copyButton);
      
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('test@example.com');
      });
      
      // No navigation should occur
      expect(window.location.href).toBe('');
      
      window.location = originalLocation;
    });

    it('should show toast notification after copy', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>) = writeTextMock;
      
      render(<EmailContactButton email="test@example.com" />);
      
      const copyButton = screen.getByRole('button', { name: /copy username/i });
      await user.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('PhoneContactButton', () => {
    it('should render and display phone correctly', () => {
      render(<PhoneContactButton phone="+7 (983) 320-97-85" />);
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('+7 (983) 320-97-85')).toBeInTheDocument();
    });

    it('should have correct tel link', () => {
      render(<PhoneContactButton phone="+7 (983) 320-97-85" />);
      const link = screen.getByLabelText('Phone +7 (983) 320-97-85');
      expect(link).toHaveAttribute('href', 'tel:+7(983)320-97-85');
    });

    it('should copy phone without triggering tel link', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>) = writeTextMock;
      
      // Mock window.location to detect navigation
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as Location;
      
      render(<PhoneContactButton phone="+7 (983) 320-97-85" />);
      
      const copyButton = screen.getByRole('button', { name: /copy username/i });
      await user.click(copyButton);
      
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('+7 (983) 320-97-85');
      });
      
      // No navigation should occur
      expect(window.location.href).toBe('');
      
      window.location = originalLocation;
    });

    it('should show toast notification after copy', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>) = writeTextMock;
      
      render(<PhoneContactButton phone="+7 (983) 320-97-85" />);
      
      const copyButton = screen.getByRole('button', { name: /copy username/i });
      await user.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-component consistency', () => {
    it('should have consistent styling and behavior across all contact buttons', () => {
      const { container: telegramContainer } = render(<TelegramContactButton username="test" />);
      const { container: emailContainer } = render(<EmailContactButton email="test@example.com" />);
      const { container: phoneContainer } = render(<PhoneContactButton phone="+1234567890" />);
      
      // All should have copy buttons
      expect(screen.getAllByRole('button', { name: /copy username/i })).toHaveLength(3);
      
      // All should have labels
      expect(screen.getByText('Telegram')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });

    it('should handle multiple copy operations without conflicts', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>) = writeTextMock;
      
      render(
        <>
          <TelegramContactButton username="test_user" />
          <EmailContactButton email="test@example.com" />
          <PhoneContactButton phone="+1234567890" />
        </>
      );
      
      const copyButtons = screen.getAllByRole('button', { name: /copy username/i });
      
      // Copy from Telegram
      await user.click(copyButtons[0]);
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('@test_user');
      });
      
      // Copy from Email
      await user.click(copyButtons[1]);
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('test@example.com');
      });
      
      // Copy from Phone
      await user.click(copyButtons[2]);
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('+1234567890');
      });
      
      // All three should have been called
      expect(writeTextMock).toHaveBeenCalledTimes(3);
    });
  });
});

