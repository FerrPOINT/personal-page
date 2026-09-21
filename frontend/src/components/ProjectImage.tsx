import React, { useState } from 'react';
import type { Locale, ProjectMedia } from '../content/types';

interface ProjectImageProps {
  media: ProjectMedia;
  locale: Locale;
  title: string;
  className?: string;
  sizes?: string;
}

const ProjectImage: React.FC<ProjectImageProps> = ({
  media,
  locale,
  title,
  className = '',
  sizes = '(min-width: 768px) 50vw, 100vw',
}) => {
  const [failed, setFailed] = useState(false);
  const alt = media.alt[locale];

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`accent-gradient-flow flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-primary/20 via-surface to-accent-secondary/20 p-8 text-center ${className}`}
      >
        <span className="max-w-sm font-mono text-sm text-white/70">{title}</span>
      </div>
    );
  }

  const imageStyle = media.objectPosition ? { objectPosition: media.objectPosition } : undefined;

  return (
    <picture>
      <source
        type="image/avif"
        srcSet={`${media.avif.small} 800w, ${media.avif.large} 1600w`}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={`${media.webp.small} 800w, ${media.webp.large} 1600w`}
        sizes={sizes}
      />
      <img
        src={media.webp.large}
        srcSet={`${media.webp.small} 800w, ${media.webp.large} 1600w`}
        sizes={sizes}
        width={1600}
        height={900}
        loading="lazy"
        decoding="async"
        alt={alt}
        onError={() => setFailed(true)}
        style={imageStyle}
        className={className}
      />
    </picture>
  );
};

export default ProjectImage;
