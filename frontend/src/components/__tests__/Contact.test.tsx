import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Contact from '../Contact';

vi.mock('../../i18n/hooks/useLanguage', () => ({ useLanguage: () => ({
  language: 'ru',
  t: (key: string) => ({
    'contact.form.name': 'Имя', 'contact.form.email': 'Email', 'contact.form.message': 'Сообщение',
    'contact.form.namePlaceholder': 'Имя', 'contact.form.emailPlaceholder': 'Email',
    'contact.form.messagePlaceholder': 'Текст', 'contact.form.submit': 'Отправить',
    'contact.form.success': 'Сообщение принято и будет доставлено',
    'contact.form.error413': 'Слишком большое сообщение', 'contact.form.error429': 'Слишком много запросов',
    'contact.form.error500': 'Ошибка сервера', 'contact.form.errorTimeout': 'Таймаут',
    'contact.form.errorNetwork': 'Ошибка сети', 'contact.form.errorUnknown': 'Ошибка',
  } as Record<string, string>)[key] || key,
}) }));

async function submit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Имя'), 'Alex');
  await user.type(screen.getByLabelText('Email'), 'alex@example.com');
  await user.type(screen.getByLabelText('Сообщение'), 'Hello');
  await user.click(screen.getByRole('button', { name: /Отправить/ }));
}

describe('contact form', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('has accessible field names and a 5000-character limit', () => {
    render(<Contact />);
    expect(screen.getByLabelText('Имя')).toHaveAttribute('autocomplete', 'name');
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Сообщение')).toHaveAttribute('maxlength', '5000');
  });

  it('shows accepted state after HTTP 202 and clears the form', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      success: true, data: { id: 'id', status: 'pending' },
    }), { status: 202, headers: { 'content-type': 'application/json' } }));
    render(<Contact />);
    await submit();
    expect(await screen.findByText('Сообщение принято и будет доставлено')).toBeInTheDocument();
    expect(screen.getByLabelText('Сообщение')).toHaveValue('');
  });

  it.each([400, 409, 413, 429, 500])('preserves the form after HTTP %s', async (status) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      success: false, error: { code: 'ERROR', message: `Ошибка ${status}` },
    }), { status, headers: { 'content-type': 'application/json' } }));
    render(<Contact />);
    await submit();
    await waitFor(() => expect(screen.getByLabelText('Сообщение')).toHaveValue('Hello'));
  });
});
