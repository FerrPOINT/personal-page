import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailContactButton from '../EmailContactButton';
import PhoneContactButton from '../PhoneContactButton';
import TelegramContactButton from '../TelegramContactButton';

vi.mock('../../i18n/hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => ({
  'contact.telegram.label': 'Telegram', 'contact.email': 'Email', 'contact.phone': 'Phone',
  'contact.telegram.copyTooltip': 'Copy', 'contact.telegram.copied': 'Copied',
} as Record<string, string>)[key] || key }) }));

describe('contact links', () => {
  it('renders ordinary links with sibling copy buttons', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const { container } = render(<>
      <TelegramContactButton username="azhukov7" />
      <EmailContactButton email="test@example.com" />
      <PhoneContactButton phone="+7 (983) 320-97-85" />
    </>);
    expect(screen.getByRole('link', { name: 'Telegram @azhukov7' })).toHaveAttribute('href', 'https://t.me/azhukov7');
    expect(screen.getByRole('link', { name: 'Email test@example.com' })).toHaveAttribute('href', 'mailto:test@example.com');
    expect(screen.getByRole('link', { name: 'Phone +7 (983) 320-97-85' })).toHaveAttribute('href', 'tel:+79833209785');
    expect(container.querySelector('a button')).toBeNull();
    await user.click(screen.getAllByRole('button', { name: 'Copy' })[0]);
    expect(writeText).toHaveBeenCalledWith('@azhukov7');
  });
});
