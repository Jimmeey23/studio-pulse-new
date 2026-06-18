import * as React from 'react';

const GlobalCommandPalette = React.lazy(() =>
  import('@/components/ui/GlobalCommandPalette'),
);

const isCommandPaletteShortcut = (event: KeyboardEvent) => {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  return (isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'k';
};

const isSlashShortcut = (event: KeyboardEvent) => {
  if (event.key !== '/') return false;
  const activeTag = (document.activeElement?.tagName || '').toLowerCase();
  return activeTag !== 'input' && activeTag !== 'textarea';
};

export function LazyGlobalCommandPalette() {
  const [shouldLoad, setShouldLoad] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isCommandPaletteShortcut(event) || isSlashShortcut(event)) {
        event.preventDefault();
        setShouldLoad(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!shouldLoad) return null;

  return (
    <React.Suspense fallback={null}>
      <GlobalCommandPalette initialOpen />
    </React.Suspense>
  );
}

export default LazyGlobalCommandPalette;
