import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TelegramContactButton from '../TelegramContactButton';

// Mock fetch globally
global.fetch = vi.fn();

// Mock useLanguage hook
vi.mock('../../i18n/hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'contact.telegram.label': 'Telegram',
        'contact.telegram.writeButton': 'Write in Telegram',
        'contact.telegram.copyTooltip': 'Copy username',
        'contact.telegram.copied': 'Copied!',
      };
      return translations[key] || key;
    },
  }),
}));

describe('TelegramContactButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.open mock
    (window.open as ReturnType<typeof vi.fn>).mockClear();
    // Reset clipboard mock if it exists and is a vi.fn
    if (navigator.clipboard && 
        typeof navigator.clipboard.writeText === 'function' &&
        'mockClear' in navigator.clipboard.writeText) {
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockClear();
    }
    // Mock fetch to return failed response (will use fallback)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render contact card with label and username', () => {
    render(<TelegramContactButton username="test_user" />);
    
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.getByText('@test_user')).toBeInTheDocument();
    expect(screen.getByLabelText('Telegram contact')).toBeInTheDocument();
  });

  it('should render copy button', () => {
    render(<TelegramContactButton username="test_user" />);
    
    const copyButton = screen.getByRole('button', { name: /copy username/i });
    expect(copyButton).toBeInTheDocument();
  });

  it('should open Telegram link when contact card is clicked (desktop)', async () => {
    // Ensure Telegram Web App is not available
    delete (window as any).Telegram;
    
    const user = userEvent.setup();
    render(<TelegramContactButton username="test_user" />);
    
    const contactCard = screen.getByLabelText('Telegram contact');
    await user.click(contactCard);
    
    expect(window.open).toHaveBeenCalled();
    const callArgs = (window.open as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toContain('https://t.me/');
    expect(callArgs[1]).toBe('_blank');
    expect(callArgs[2]).toBe('noopener,noreferrer');
  });

  it('should use Telegram Web App API when available', async () => {
    const user = userEvent.setup();
    const mockOpenTelegramLink = vi.fn();
    
    // Set up Telegram Web App
    (window as any).Telegram = {
      WebApp: {
        openTelegramLink: mockOpenTelegramLink,
      },
    };
    
    render(<TelegramContactButton username="test_user" />);
    
    const contactCard = screen.getByLabelText('Telegram contact');
    await user.click(contactCard);
    
    // Component uses: import.meta.env.VITE_TELEGRAM_USERNAME || username
    // Since env is mocked to 'test_username' in setup.ts, it should use that
    // But if env is not set, it uses the prop 'test_user'
    expect(mockOpenTelegramLink).toHaveBeenCalled();
    const callArgs = mockOpenTelegramLink.mock.calls[0][0];
    expect(callArgs).toContain('https://t.me/');
    expect(window.open).not.toHaveBeenCalled();
  });

  it('should copy username to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    
    // Ensure clipboard is available
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        configurable: true,
        value: { writeText: writeTextMock },
      });
    } else {
      // Replace existing mock
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>) = writeTextMock;
    }
    
    render(<TelegramContactButton username="test_user" />);
    
    const copyButton = screen.getByRole('button', { name: /copy username/i });
    await user.click(copyButton);
    
    // Component uses: import.meta.env.VITE_TELEGRAM_USERNAME || username
    // Since env is mocked to 'test_username' in setup.ts, it should use that
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    const callArgs = writeTextMock.mock.calls[0][0];
    expect(callArgs).toMatch(/^@\w+$/); // Should be @username format
    
    // Check that toast appears
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should prevent contact card action when copy button is clicked', async () => {
    const user = userEvent.setup();
    render(<TelegramContactButton username="test_user" />);
    
    const copyButton = screen.getByRole('button', { name: /copy username/i });
    await user.click(copyButton);
    
    // Contact card should not trigger window.open
    expect(window.open).not.toHaveBeenCalled();
  });

  it('should use fallback copy method for older browsers', async () => {
    const user = userEvent.setup();
    
    // Mock clipboard as unavailable (no clipboard property)
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    
    // Use the execCommand mock from setup.ts
    const execCommandSpy = vi.spyOn(document, 'execCommand');
    
    render(<TelegramContactButton username="test_user" />);
    
    const copyButton = screen.getByRole('button', { name: /copy username/i });
    await user.click(copyButton);
    
    // Should use fallback method (execCommand for copy)
    await waitFor(() => {
      expect(execCommandSpy).toHaveBeenCalledWith('copy');
    }, { timeout: 2000 });
    
    execCommandSpy.mockRestore();
  });

  it('should use username from props when env variable is not set', () => {
    render(<TelegramContactButton username="fallback_user" />);
    
    expect(screen.getByText('@fallback_user')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
  });

  it('should handle copy error gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock clipboard.writeText to throw an error
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: { writeText: writeTextMock },
    });
    
    render(<TelegramContactButton username="test_user" />);
    
    const copyButton = screen.getByRole('button', { name: /copy username/i });
    await user.click(copyButton);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <TelegramContactButton username="test_user" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

