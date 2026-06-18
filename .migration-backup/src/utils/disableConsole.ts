// disableConsole.ts
// Silences non-essential console output in production builds.

if (import.meta.env && import.meta.env.PROD) {
  try {
    const _originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    console.log = () => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    console.info = () => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    console.debug = () => {};

    if (typeof window !== 'undefined') {
      (window as any).__originalConsole = _originalConsole;
    }
  } catch (err) {
    // If anything goes wrong, do not block the app.
  }
}
