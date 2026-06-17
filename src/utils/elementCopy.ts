export type CopiedElementPayload = {
  title: string;
  html: string;
  text: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const extractElementTitle = (element: HTMLElement, fallback = 'Dashboard Element') => {
  const directCandidates = [
    element.getAttribute('data-copy-title'),
    element.getAttribute('aria-label'),
    element.getAttribute('data-title'),
    element.querySelector('[data-slot="card-title"]')?.textContent,
    element.querySelector('h1, h2, h3, h4, h5, h6')?.textContent,
  ];

  return directCandidates.map((candidate) => candidate?.trim()).find(Boolean) || fallback;
};

export const isCopyableDashboardElement = (element: HTMLElement) => {
  if (element.closest('[data-no-copy-overlay="true"]')) return false;
  if (element.closest('button, a, input, textarea, select')) return false;

  return Boolean(
    element.matches('table, ul, ol, [data-copyable-element="true"]') ||
      element.classList.contains('card') ||
      element.classList.contains('rounded-xl') ||
      element.classList.contains('rounded-2xl') ||
      element.querySelector('table') ||
      element.querySelector('ul, ol') ||
      element.querySelector('.recharts-wrapper, svg, canvas'),
  );
};

export const buildElementPayload = (element: HTMLElement, title = extractElementTitle(element)): CopiedElementPayload => {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('button, [data-copy-overlay], [data-auto-copy-overlay], script, style').forEach((node) => node.remove());

  const html = `\n<div class="p57-copied-block" style="border:1px solid #dbe3ea;border-radius:16px;padding:16px;font-family:Arial,sans-serif;background:#fff">\n  <div style="font-size:14px;font-weight:700;margin-bottom:10px;color:#0f172a">${escapeHtml(title)}</div>\n  ${clone.outerHTML}\n</div>\n`;
  const text = `${title}\n${element.textContent?.trim() || ''}`.trim();

  return { title, html, text };
};

export const buildClipboardHtml = (payload: CopiedElementPayload) =>
  `<!doctype html><html><body>${payload.html}</body></html>`;

