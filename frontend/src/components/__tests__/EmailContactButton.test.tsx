import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailContactButton from '../EmailContactButton';

// Mock useLanguage hook
vi.mock('../../i18n/hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'contact.email': 'Email',
        'contact.telegram.copyTooltip': 'Copy username',
        'contact.telegram.copied': 'Copied!',
      };
      return translations[key] || key;
    },
  }),
}));

describe('EmailContactButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: { writeText: writeTextMock },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render email contact with label and email', () => {
    render(<EmailContactButton email="test@example.com" />);
    
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Email test@example.com')).toBeInTheDocument();
  });

  it('should have mailto link', () => {
    render(<EmailContactButton email="test@example.com" />);
    
    const link = screen.getByLabelText('Email test@example.com');
    expect(link).toHaveAttribute('href', 'mailto:test@example.com');
  });

  it('should copy email to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>) = writeTextMock;
    
    render(<EmailContactButton email="test@example.com" />);
    
    const copyButton = screen.getByRole('button', { name: /copy username/i });
    await user.click(copyButton);
    
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('test@example.com');
    }, { timeout: 3000 });
    
    // Check that toast appears
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should NOT trigger mailto link when copy button is clicked', async () => {
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
    
    // Wait for copy to complete
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // Check that href was not changed (no navigation occurred)
    expect(window.location.href).toBe('');
    
    // Restore original location
    window.location = originalLocation;
  });

  it('should use fallback copy method for older browsers', async () => {
    const user = userEvent.setup();
    
    // Remove clipboard API
    delete (navigator as any).clipboard;
    
    // Mock document.execCommand
    const execCommandMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      writable: true,
      configurable: true,
      value: execCommandMock,
    });
    
    render(<EmailContactButton email="test@example.com" />);
    
    const copyButton = screen.getByRole('button', { name: /copy username/i });
    await user.click(copyButton);
    
    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith('copy');
    }, { timeout: 3000 });
  });
});

