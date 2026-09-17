import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type ComponentModule<T extends ComponentType<unknown>> = { default: T };

export const lazyWithReload = <T extends ComponentType<unknown>>(
  moduleId: string,
  importer: () => Promise<ComponentModule<T>>,
): LazyExoticComponent<T> => lazy(async () => {
  const reloadKey = `lazy-reload:${moduleId}`;

  try {
    const module = await importer();
    window.sessionStorage.removeItem(reloadKey);
    return module;
  } catch (error) {
    if (window.sessionStorage.getItem(reloadKey) !== 'attempted') {
      window.sessionStorage.setItem(reloadKey, 'attempted');
      window.location.reload();
      return new Promise<ComponentModule<T>>(() => undefined);
    }

    window.sessionStorage.removeItem(reloadKey);
    throw error;
  }
});
