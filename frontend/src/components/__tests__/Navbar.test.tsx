import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import Navbar from '../Navbar';
import { LanguageProvider } from '../../i18n/context/LanguageContext';
import { ColorThemeProvider } from '../../theme/ColorThemeContext';

function renderNavbar() {
  return render(
    <ColorThemeProvider initialTheme="neon">
      <LanguageProvider>
        <Navbar />
      </LanguageProvider>
    </ColorThemeProvider>,
  );
}

it('closes the mobile navigation with Escape and returns focus to its trigger', async () => {
  renderNavbar();

  const trigger = screen.getByRole('button', { name: 'Open menu' });
  trigger.focus();
  fireEvent.click(trigger);

  const navigation = screen.getByRole('dialog', { name: 'Primary navigation' });
  expect(within(navigation).getByRole('link', { name: 'About' })).toBeInTheDocument();
  expect(document.body.style.overflow).toBe('hidden');

  fireEvent.keyDown(document, { key: 'Escape' });

  await waitFor(() => {
    expect(screen.queryByRole('dialog', { name: 'Primary navigation' })).not.toBeInTheDocument();
  });
  expect(document.body.style.overflow).toBe('');
  expect(trigger).toHaveFocus();
});

it('keeps contact as one clear primary action instead of duplicating it in navigation', () => {
  renderNavbar();

  expect(screen.queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: "Let's Talk" })).toHaveLength(1);
});
