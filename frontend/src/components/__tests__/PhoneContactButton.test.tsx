import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhoneContactButton from '../PhoneContactButton';

// Mock useLanguage hook
vi.mock('../../i18n/hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'contact.phone': 'Phone',
        'contact.telegram.copyTooltip': 'Copy username',
        'contact.telegram.copied': 'Copied!',
      };
      return translations[key] || key;
    },
  }),
}));

describe('PhoneContactButton', () => {
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

  it('should render phone contact with label and phone', () => {
    render(<PhoneContactButton phone="+7 (983) 320-97-85" />);
    
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('+7 (983) 320-97-85')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone +7 (983) 320-97-85')).toBeInTheDocument();
  });

  it('should have tel link', () => {
    render(<PhoneContactButton phone="+7 (983) 320-97-85" />);
    
    const link = screen.getByLabelText('Phone +7 (983) 320-97-85');
    // Phone number with spaces removed (but brackets and dashes remain)
    expect(link).toHaveAttribute('href', 'tel:+7(983)320-97-85');
  });

  it('should copy phone to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>) = writeTextMock;
    
    render(<PhoneContactButton phone="+7 (983) 320-97-85" />);
    
    const copyButton = screen.getByRole('button', { name: /copy username/i });
    await user.click(copyButton);
    
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('+7 (983) 320-97-85');
    }, { timeout: 3000 });
    
    // Check that toast appears
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should NOT trigger tel link when copy button is clicked', async () => {
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
    
    render(<PhoneContactButton phone="+7 (983) 320-97-85" />);
    
    const copyButton = screen.getByRole('button', { name: /copy username/i });
    await user.click(copyButton);
    
    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith('copy');
    }, { timeout: 3000 });
  });
});

