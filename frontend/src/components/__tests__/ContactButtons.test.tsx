import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mail, Phone, Send } from 'lucide-react';
import ContactMethod from '../ContactMethod';

vi.mock('../../i18n/hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (key === 'contact.copy') return `Copy: ${params?.label}`;
      if (key === 'contact.copied') return `Copied: ${params?.label}`;
      return key;
    },
  }),
}));

describe('contact links', () => {
  it('renders ordinary links with sibling copy buttons', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const { container } = render(<>
      <ContactMethod href="https://t.me/azhukov7" icon={Send} label="Telegram" value="@azhukov7" variant="telegram" external />
      <ContactMethod href="mailto:test@example.com" icon={Mail} label="Email" value="test@example.com" variant="email" />
      <ContactMethod href="tel:+79833209785" icon={Phone} label="Phone" value="+7 (983) 320-97-85" variant="phone" />
    </>);
    expect(screen.getByRole('link', { name: 'Telegram @azhukov7' })).toHaveAttribute('href', 'https://t.me/azhukov7');
    expect(screen.getByRole('link', { name: 'Email test@example.com' })).toHaveAttribute('href', 'mailto:test@example.com');
    expect(screen.getByRole('link', { name: 'Phone +7 (983) 320-97-85' })).toHaveAttribute('href', 'tel:+79833209785');
    expect(screen.getByRole('link', { name: 'Telegram @azhukov7' })).toHaveAttribute('target', '_blank');
    expect(container.querySelector('a button')).toBeNull();
    expect([...container.querySelectorAll('a svg')]).toHaveLength(3);
    for (const icon of container.querySelectorAll('a svg')) {
      expect(icon).toHaveClass('group-hover:scale-110');
      expect(icon).toHaveClass('group-hover:brightness-125');
      expect(icon).toHaveClass('group-hover:drop-shadow-[0_0_8px_currentColor]');
    }
    expect(screen.getByRole('button', { name: 'Copy: Email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy: Phone' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy: Telegram' }));
    expect(writeText).toHaveBeenCalledWith('@azhukov7');
  });
});
