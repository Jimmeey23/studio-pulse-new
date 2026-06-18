import { buildConsolidatedExportRoute, clearConsolidatedExportPreset, type ConsolidatedExportPreset, saveConsolidatedExportPreset } from '@/utils/consolidatedExportPreset';
import { discoverPageTables, extractTableName, isGroupedTableRow, isTotalsTableRow } from '@/utils/tableCopy';

export interface ConsolidatedRouteOption {
  id: string;
  label: string;
  path: string;
  defaultSelected?: boolean;
}

export interface ConsolidatedCollectedTable {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
}

export interface ConsolidatedCollectedTab {
  label: string;
  tables: ConsolidatedCollectedTable[];
}

export interface ConsolidatedCollectedRoute {
  id: string;
  label: string;
  path: string;
  tabs: ConsolidatedCollectedTab[];
  note?: string;
}

export interface ConsolidatedReportBundle {
  title: string;
  generatedAt: string;
  preset: ConsolidatedExportPreset;
  routes: ConsolidatedCollectedRoute[];
}

export const CONSOLIDATED_ROUTE_OPTIONS: ConsolidatedRouteOption[] = [
  { id: 'sales-analytics', label: 'Sales Analytics', path: '/sales-analytics', defaultSelected: true },
  { id: 'funnel-leads', label: 'Funnel & Leads', path: '/funnel-leads', defaultSelected: true },
  { id: 'client-retention', label: 'Client Retention', path: '/client-retention', defaultSelected: true },
  { id: 'trainer-performance', label: 'Trainer Performance', path: '/trainer-performance', defaultSelected: true },
  { id: 'class-attendance', label: 'Class Attendance', path: '/class-attendance', defaultSelected: true },
  { id: 'class-formats', label: 'Class Formats Comparison', path: '/class-formats', defaultSelected: true },
  { id: 'discounts-promotions', label: 'Discounts & Promotions', path: '/discounts-promotions', defaultSelected: true },
  { id: 'sessions', label: 'Sessions Analytics', path: '/sessions', defaultSelected: true },
  { id: 'expiration-analytics', label: 'Expiration Analytics', path: '/expiration-analytics', defaultSelected: true },
  { id: 'late-cancellations', label: 'Late Cancellations', path: '/late-cancellations', defaultSelected: true },
  { id: 'patterns-trends', label: 'Patterns & Trends', path: '/patterns-trends', defaultSelected: true },
  { id: 'forecasting-action-center', label: 'Forecasting & Action Center', path: '/forecasting-action-center', defaultSelected: true },
  { id: 'member-lifecycle', label: 'Member 360 & Lifecycle', path: '/member-lifecycle', defaultSelected: true },
  { id: 'location-report', label: 'Location Report', path: '/location-report', defaultSelected: true },
];

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const sanitizeFileSegment = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9\-_\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'report';

const normalizeCellText = (value: string) => value.replace(/[↑↓▲▼]/g, '').replace(/\s+/g, ' ').trim();

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const isVisibleElement = (element: HTMLElement) => {
  const view = element.ownerDocument.defaultView || window;
  const style = view.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
};

const createHiddenIframe = (url: string) => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-99999px';
  iframe.style.top = '0';
  iframe.style.width = '1440px';
  iframe.style.height = '1024px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);
  iframe.src = url;
  return iframe;
};

const waitForIframeLoad = async (iframe: HTMLIFrameElement, timeoutMs = 45000) => {
  const isRouteReady = () => {
    try {
      const doc = iframe.contentDocument;
      const href = iframe.contentWindow?.location?.href || '';
      return Boolean(doc && doc.readyState !== 'loading' && href && href !== 'about:blank');
    } catch {
      return false;
    }
  };

  if (isRouteReady()) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      window.clearInterval(poller);
      window.clearTimeout(timer);
    };

    const handleLoad = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error('Route iframe failed to load.'));
    };

    const timer = window.setTimeout(() => {
      if (isRouteReady()) {
        cleanup();
        resolve();
        return;
      }

      cleanup();
      reject(new Error('Timed out waiting for route iframe to load.'));
    }, timeoutMs);

    iframe.addEventListener('load', handleLoad, { once: true });
    iframe.addEventListener('error', handleError, { once: true });

    const poller = window.setInterval(() => {
      if (isRouteReady()) {
        cleanup();
        resolve();
      }
    }, 250);

    if (isRouteReady()) {
      cleanup();
      resolve();
    }
  });
};

const waitForIframeStability = async (iframe: HTMLIFrameElement, timeoutMs = 45000) => {
  let stablePolls = 0;
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const doc = iframe.contentDocument;
    if (!doc || !doc.body) {
      await sleep(150);
      continue;
    }

    const bodyText = doc.body.innerText || '';
    const visibleTables = discoverPageTables(doc).filter(({ element }) => isVisibleElement(element));
    const loaderVisible = /Loading analytics dashboard|Loading page|Analyzing trainer performance|Loading member lifecycle analytics|Loading funnel and lead conversion data/i.test(bodyText);
    const hasMeaningfulContent = bodyText.replace(/\s+/g, ' ').trim().length > 120;
    const hasEmptyState = /No data|No records|No late cancellations|No discounts|No visible tables/i.test(bodyText);

    if (!loaderVisible && visibleTables.length > 0) {
      await sleep(500);
      return;
    }

    if (!loaderVisible && (hasMeaningfulContent || hasEmptyState) && doc.readyState === 'complete') {
      stablePolls += 1;
      if (stablePolls >= 4) {
        await sleep(350);
        return;
      }
    } else {
      stablePolls = 0;
    }

    await sleep(250);
  }
};

const extractTableFromElement = (table: HTMLTableElement, index: number): ConsolidatedCollectedTable | null => {
  const headerRow =
    table.querySelector('thead tr') ||
    table.querySelector('tr:has(th)') ||
    table.querySelector('tr');

  const headerTableRow = headerRow instanceof HTMLTableRowElement ? headerRow : null;
  const headers = headerTableRow
    ? Array.from(headerTableRow.cells).map((cell) => normalizeCellText(cell.textContent || ''))
    : [];

  const rows = Array.from(table.querySelectorAll('tbody tr, tr'))
    .filter((row): row is HTMLTableRowElement => row instanceof HTMLTableRowElement)
    .filter((row) => row !== headerTableRow)
    .map((row) => {
      const cells = Array.from(row.cells);
      const skip = isGroupedTableRow(row) && !isTotalsTableRow(row);
      if (skip) return null;
      return cells.map((cell) => normalizeCellText(cell.textContent || ''));
    })
    .filter((row): row is string[] => Array.isArray(row) && row.some((cell) => cell !== ''));

  if (headers.length === 0 && rows.length === 0) {
    return null;
  }

  const name = extractTableName(table, `Table ${index + 1}`);

  return {
    id: `${sanitizeFileSegment(name).toLowerCase()}-${index + 1}`,
    name,
    headers,
    rows,
  };
};

const collectVisibleTables = (doc: Document) => {
  return discoverPageTables(doc)
    .filter(({ element }) => isVisibleElement(element))
    .map(({ element }, index) => extractTableFromElement(element, index))
    .filter((table): table is ConsolidatedCollectedTable => Boolean(table));
};

const collectTablesFromRoot = (root: ParentNode) => {
  return discoverPageTables(root)
    .map(({ element }, index) => extractTableFromElement(element, index))
    .filter((table): table is ConsolidatedCollectedTable => Boolean(table));
};

const getVisibleTabTriggers = (doc: Document) => {
  return Array.from(doc.querySelectorAll('[role="tab"]'))
    .filter((element): element is HTMLElement => element instanceof HTMLElement)
    .filter((element) => isVisibleElement(element));
};

const activateTabTrigger = async (trigger: HTMLElement) => {
  trigger.focus();
  ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach((eventName) => {
    trigger.dispatchEvent(new MouseEvent(eventName, { bubbles: true, cancelable: true, view: trigger.ownerDocument.defaultView || window }));
  });
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await sleep(450);
};

const collectTablesForTrigger = (doc: Document, trigger: HTMLElement) => {
  const panelId = trigger.getAttribute('aria-controls');
  if (panelId) {
    const panel = doc.getElementById(panelId);
    if (panel) {
      const visibleTables = collectTablesFromRoot(panel).filter((table) => {
        const candidate = panel.querySelector(`[data-table="${table.id}"]`) as HTMLElement | null;
        return candidate ? isVisibleElement(candidate) : true;
      });
      if (visibleTables.length > 0) {
        return visibleTables;
      }

      const fallbackPanelTables = collectTablesFromRoot(panel);
      if (fallbackPanelTables.length > 0) {
        return fallbackPanelTables;
      }
    }
  }

  const activePanels = Array.from(doc.querySelectorAll('[role="tabpanel"]'))
    .filter((element): element is HTMLElement => element instanceof HTMLElement)
    .filter((element) => element.getAttribute('data-state') === 'active' || isVisibleElement(element));

  for (const panel of activePanels) {
    const tables = collectTablesFromRoot(panel);
    if (tables.length > 0) {
      return tables;
    }
  }

  return collectVisibleTables(doc);
};

const collectRouteTabs = async (doc: Document) => {
  const tabs: ConsolidatedCollectedTab[] = [];
  const currentTables = collectVisibleTables(doc);
  if (currentTables.length > 0) {
    tabs.push({ label: 'Current View', tables: currentTables });
  }

  const triggers = getVisibleTabTriggers(doc);
  const visited = new Set<string>();

  for (const [index, trigger] of triggers.entries()) {
    const label = normalizeCellText(trigger.textContent || '') || trigger.getAttribute('value') || 'Tab';
    const visitKey = `${index}:${label}`;
    if (visited.has(visitKey) || label.toLowerCase() === 'current view') continue;
    visited.add(visitKey);

    if (trigger.getAttribute('data-state') !== 'active') {
      await activateTabTrigger(trigger);
    }

    const tables = collectTablesForTrigger(doc, trigger);
    if (tables.length > 0) {
      tabs.push({ label, tables });
    }
  }

  return tabs.filter((tab, index, allTabs) => {
    if (tab.tables.length === 0) return false;
    if (index === 0) return true;
    const sameAsCurrent = JSON.stringify(tab.tables) === JSON.stringify(allTabs[0].tables);
    return !sameAsCurrent;
  });
};

const buildMarkdownReport = (bundle: ConsolidatedReportBundle) => {
  const lines: string[] = [
    `# ${bundle.title}`,
    '',
    `- Generated: ${new Date(bundle.generatedAt).toLocaleString()}`,
    `- Studio: ${bundle.preset.studioId}`,
    `- Period: ${bundle.preset.startDate} to ${bundle.preset.endDate}`,
    `- Routes included: ${bundle.routes.length}`,
    '',
  ];

  bundle.routes.forEach((route) => {
    lines.push(`## ${route.label}`);
    if (route.note) {
      lines.push(`> ${route.note}`);
      lines.push('');
    }
    route.tabs.forEach((tab) => {
      lines.push(`### ${tab.label}`);
      tab.tables.forEach((table) => {
        lines.push(`#### ${table.name}`);
        if (table.headers.length > 0) {
          lines.push(`| ${table.headers.join(' | ')} |`);
          lines.push(`| ${table.headers.map(() => '---').join(' | ')} |`);
        }
        table.rows.forEach((row) => {
          lines.push(`| ${row.join(' | ')} |`);
        });
        lines.push('');
      });
    });
  });

  return lines.join('\n');
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildHtmlReport = (bundle: ConsolidatedReportBundle) => {
  let html = `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(bundle.title)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;color:#0f172a;}h1{font-size:28px;margin-bottom:8px;}h2{margin-top:28px;font-size:20px;}h3{margin-top:18px;font-size:16px;color:#334155;}h4{margin-top:14px;font-size:14px;color:#475569;}table{border-collapse:collapse;width:100%;margin:12px 0 24px;font-size:12px;}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left;}thead th{background:#0f172a;color:white;}ul.meta{padding-left:18px;color:#475569;}</style></head><body>`;
  html += `<h1>${escapeHtml(bundle.title)}</h1>`;
  html += `<ul class="meta"><li>Generated: ${escapeHtml(new Date(bundle.generatedAt).toLocaleString())}</li><li>Studio: ${escapeHtml(bundle.preset.studioId)}</li><li>Period: ${escapeHtml(`${bundle.preset.startDate} to ${bundle.preset.endDate}`)}</li></ul>`;

  bundle.routes.forEach((route) => {
    html += `<h2>${escapeHtml(route.label)}</h2>`;
    if (route.note) {
      html += `<p><em>${escapeHtml(route.note)}</em></p>`;
    }
    route.tabs.forEach((tab) => {
      html += `<h3>${escapeHtml(tab.label)}</h3>`;
      tab.tables.forEach((table) => {
        html += `<h4>${escapeHtml(table.name)}</h4>`;
        html += '<table><thead><tr>';
        table.headers.forEach((header) => {
          html += `<th>${escapeHtml(header)}</th>`;
        });
        html += '</tr></thead><tbody>';
        table.rows.forEach((row) => {
          html += '<tr>';
          row.forEach((cell) => {
            html += `<td>${escapeHtml(cell)}</td>`;
          });
          html += '</tr>';
        });
        html += '</tbody></table>';
      });
    });
  });

  html += '</body></html>';
  return html;
};

const buildPlainTextReport = (bundle: ConsolidatedReportBundle) => {
  const lines: string[] = [
    bundle.title,
    '='.repeat(bundle.title.length),
    `Generated: ${new Date(bundle.generatedAt).toLocaleString()}`,
    `Studio: ${bundle.preset.studioId}`,
    `Period: ${bundle.preset.startDate} to ${bundle.preset.endDate}`,
    '',
  ];

  bundle.routes.forEach((route) => {
    lines.push(route.label);
    lines.push('-'.repeat(route.label.length));
    if (route.note) lines.push(route.note);
    route.tabs.forEach((tab) => {
      lines.push(`> ${tab.label}`);
      tab.tables.forEach((table) => {
        lines.push(table.name);
        if (table.headers.length > 0) {
          lines.push(table.headers.join('\t'));
          lines.push(table.headers.map(() => '---').join('\t'));
        }
        table.rows.forEach((row) => lines.push(row.join('\t')));
        lines.push('');
      });
    });
    lines.push('');
  });

  return lines.join('\n');
};

export type ConsolidatedReportFormat = 'markdown' | 'html' | 'txt' | 'json';

export interface GenerateConsolidatedReportOptions {
  preset: ConsolidatedExportPreset;
  routes: ConsolidatedRouteOption[];
  format: ConsolidatedReportFormat;
  fileNamePrefix: string;
}

export const generateConsolidatedReport = async ({
  preset,
  routes,
  format,
  fileNamePrefix,
}: GenerateConsolidatedReportOptions) => {
  const runId = `${Date.now()}`;
  const collectedRoutes: ConsolidatedCollectedRoute[] = [];

  saveConsolidatedExportPreset(preset);

  try {
    for (const route of routes) {
      const iframe = createHiddenIframe(buildConsolidatedExportRoute(route.path, preset, runId));
      try {
        await waitForIframeLoad(iframe);
        await waitForIframeStability(iframe);
        const doc = iframe.contentDocument;

        if (!doc) {
          collectedRoutes.push({ id: route.id, label: route.label, path: route.path, tabs: [], note: 'Unable to access route document.' });
          continue;
        }

        let tabs = await collectRouteTabs(doc);

        if (tabs.length === 0) {
          await sleep(1000);
          tabs = await collectRouteTabs(doc);
        }

        collectedRoutes.push({
          id: route.id,
          label: route.label,
          path: route.path,
          tabs,
          note: tabs.length === 0 ? 'No visible tables were detected for this route.' : undefined,
        });
      } catch (error) {
        collectedRoutes.push({
          id: route.id,
          label: route.label,
          path: route.path,
          tabs: [],
          note: error instanceof Error ? error.message : 'Unknown route export failure.',
        });
      } finally {
        iframe.remove();
      }
    }
  } finally {
    clearConsolidatedExportPreset();
  }

  const bundle: ConsolidatedReportBundle = {
    title: 'Physique 57 Consolidated Table Report',
    generatedAt: new Date().toISOString(),
    preset,
    routes: collectedRoutes,
  };

  const safeFileBase = `${sanitizeFileSegment(fileNamePrefix)}-${preset.studioId}-${preset.startDate}-to-${preset.endDate}`;

  if (format === 'markdown') {
    downloadBlob(new Blob([buildMarkdownReport(bundle)], { type: 'text/markdown;charset=utf-8;' }), `${safeFileBase}.md`);
  } else if (format === 'html') {
    downloadBlob(new Blob([buildHtmlReport(bundle)], { type: 'text/html;charset=utf-8;' }), `${safeFileBase}.html`);
  } else if (format === 'txt') {
    downloadBlob(new Blob([buildPlainTextReport(bundle)], { type: 'text/plain;charset=utf-8;' }), `${safeFileBase}.txt`);
  } else {
    downloadBlob(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8;' }), `${safeFileBase}.json`);
  }

  return bundle;
};