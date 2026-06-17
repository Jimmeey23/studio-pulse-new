import { calculateMetrics } from '../utils/calculations';

// This is a lightweight worker stub. The app currently processes data on main thread.
// Worker kept for future use and parity with external repo.

self.addEventListener('message', (ev: MessageEvent) => {
  const { type, payload } = ev.data || {};
  if (type === 'PROCESS_DATA') {
    const sessions = Array.isArray(payload) ? payload : [];
    const processed = sessions.map((s: any) => ({ ...s, metrics: calculateMetrics(s) }));
    (self as any).postMessage({ type: 'DATA_PROCESSED', payload: processed });
  }
});
