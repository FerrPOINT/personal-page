import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ProjectMedia } from '../../content';
import ProjectImage from '../ProjectImage';

const media: ProjectMedia = {
  kind: 'cover',
  avif: { small: '/cover-800.avif', large: '/cover-1600.avif' },
  webp: { small: '/cover-800.webp', large: '/cover-1600.webp' },
  alt: { ru: 'Архитектурная схема', en: 'Architecture diagram' },
};

describe('ProjectImage', () => {
  it('renders responsive AVIF and WebP sources with stable dimensions', () => {
    const { container } = render(<ProjectImage media={media} locale="en" title="Project" />);
    const image = screen.getByRole('img', { name: 'Architecture diagram' });
    expect(image).toHaveAttribute('width', '1600');
    expect(image).toHaveAttribute('height', '900');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(container.querySelector('source[type="image/avif"]')).toHaveAttribute('srcset', expect.stringContaining('cover-800.avif'));
    expect(container.querySelector('source[type="image/webp"]')).toHaveAttribute('srcset', expect.stringContaining('cover-1600.webp'));
  });

  it('shows an accessible fallback when the image cannot load', () => {
    render(<ProjectImage media={media} locale="ru" title="Проект" />);
    fireEvent.error(screen.getByRole('img', { name: 'Архитектурная схема' }));
    expect(screen.getByRole('img', { name: 'Архитектурная схема' })).toHaveTextContent('Проект');
  });
});
