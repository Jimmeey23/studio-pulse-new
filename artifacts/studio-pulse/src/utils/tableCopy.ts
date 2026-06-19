export interface TableCopyContextInfo {
  selectedMetric?: string;
  dateRange?: { start: string; end: string };
  filters?: Record<string, any>;
  location?: string;
  additionalInfo?: Record<string, any>;
}

const getRowText = (row: Element) => row.textContent?.trim().toLowerCase() || '';

export const isGroupedTableRow = (row: Element) => {
  const rowText = getRowText(row);
  const firstCell = row.querySelector('td:first-child, th:first-child');

  return (
    row.classList.contains('bg-slate-100') ||
    row.classList.contains('bg-gray-100') ||
    row.classList.contains('bg-slate-50') ||
    row.classList.contains('bg-gray-50') ||
    row.classList.contains('group-row') ||
    row.classList.contains('category-row') ||
    row.classList.contains('section-header') ||
    row.classList.contains('group-header') ||
    row.classList.contains('category-header') ||
    row.querySelector('button[class*="ChevronRight"], button[class*="ChevronDown"]') !== null ||
    row.querySelector('svg.lucide-chevron-right, svg.lucide-chevron-down') !== null ||
    row.querySelector('[data-lucide="chevron-right"], [data-lucide="chevron-down"]') !== null ||
    row.querySelector('.fa-chevron-right, .fa-chevron-down') !== null ||
    row.hasAttribute('data-group') ||
    row.hasAttribute('data-category') ||
    row.hasAttribute('data-section') ||
    row.hasAttribute('data-grouped') ||
    !!(firstCell && firstCell.getAttribute('colspan') && parseInt(firstCell.getAttribute('colspan') || '1', 10) > 1) ||
    rowText.includes('expand') ||
    rowText.includes('collapse') ||
    rowText.includes('show more') ||
    rowText.includes('show less') ||
    (rowText.includes('items') && !rowText.match(/\d+\s+items/)) ||
    rowText.includes('category:') ||
    rowText.includes('group:') ||
    rowText.includes('section:') ||
    (rowText.length > 0 &&
      rowText.length < 50 &&
      !rowText.match(/\d/) &&
      !rowText.includes('₹') &&
      !rowText.includes('%') &&
      !rowText.includes(':') &&
      row.querySelectorAll('td, th').length <= 2)
  );
};

export const isTotalsTableRow = (row: Element) => {
  const rowText = row.textContent?.trim() || '';
  const firstCell = row.querySelector('td:first-child, th:first-child');
  const firstCellText = firstCell?.textContent?.trim().toLowerCase() || '';

  return (
    row.classList.contains('bg-slate-800') ||
    row.classList.contains('bg-gray-800') ||
    row.classList.contains('bg-slate-900') ||
    row.classList.contains('totals-row') ||
    row.classList.contains('summary-row') ||
    row.classList.contains('footer-row') ||
    rowText.includes('TOTALS') ||
    rowText.includes('TOTAL') ||
    rowText.includes('Total') ||
    rowText.includes('Sum') ||
    rowText.includes('Summary') ||
    rowText.includes('Grand Total') ||
    rowText.includes('Subtotal') ||
    firstCellText === 'total' ||
    firstCellText === 'totals' ||
    firstCellText === 'grand total' ||
    firstCellText === 'summary' ||
    firstCellText.startsWith('total ')
  );
};

export const extractTableName = (element: HTMLElement, fallback = 'Table') => {
  const directName =
    element.getAttribute('data-table-name') ||
    element.getAttribute('data-table') ||
    element.getAttribute('aria-label') ||
    element.querySelector('caption')?.textContent?.trim();

  if (directName) return directName;

  const heading = element
    .closest('[role="tabpanel"], section, .card, .rounded-2xl, .rounded-xl, .overflow-x-auto, .container')
    ?.querySelector('h1, h2, h3, h4, [data-table-title]')
    ?.textContent
    ?.trim();

  return heading || fallback;
};

export const extractTableTextFromContainer = (
  container: HTMLElement,
  tableName: string,
  contextInfo?: TableCopyContextInfo,
) => {
  const table = (container.querySelector('table') as HTMLElement | null) || container;
  let textContent = `${tableName}\n`;
  textContent += `Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;

  if (contextInfo) {
    textContent += `\n--- Export Context ---\n`;

    if (contextInfo.selectedMetric) {
      textContent += `Metric: ${contextInfo.selectedMetric}\n`;
    }

    if (contextInfo.location) {
      textContent += `Location: ${contextInfo.location}\n`;
    } else if (contextInfo.filters?.location) {
      const locationValue = Array.isArray(contextInfo.filters.location)
        ? contextInfo.filters.location.join(', ')
        : contextInfo.filters.location;
      textContent += `Location: ${locationValue && locationValue !== 'all' ? locationValue : 'All Locations'}\n`;
    } else {
      textContent += `Location: All Locations\n`;
    }

    if (contextInfo.dateRange?.start && contextInfo.dateRange?.end) {
      textContent += `Date Range: ${contextInfo.dateRange.start} to ${contextInfo.dateRange.end}\n`;
    }

    if (contextInfo.filters) {
      const activeFilters: string[] = [];
      Object.entries(contextInfo.filters).forEach(([key, value]) => {
        if (key === 'location') return;
        if (value && Array.isArray(value) && value.length > 0) {
          activeFilters.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.join(', ')}`);
        } else if (value && typeof value === 'string' && value !== 'All' && value !== '') {
          activeFilters.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const subFilters = Object.entries(value)
            .filter(([_, subValue]) => subValue && subValue !== '')
            .map(([subKey, subValue]) => `${subKey}: ${subValue}`)
            .join(', ');
          if (subFilters) {
            activeFilters.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${subFilters}`);
          }
        }
      });

      textContent += `Active Filters: ${activeFilters.length > 0 ? activeFilters.join('; ') : 'None'}\n`;
    }

    if (contextInfo.additionalInfo) {
      Object.entries(contextInfo.additionalInfo).forEach(([key, value]) => {
        if (value) {
          textContent += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
        }
      });
    }

    textContent += `\n--- Table Data (Headers + Data Rows + Totals) ---\n`;
    textContent += `Note: Grouped/Category rows have been excluded\n`;
  } else {
    textContent += `\n`;
  }

  const headers: string[] = [];
  const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td');
  headerCells.forEach((cell) => {
    const text = cell.textContent?.trim() || '';
    if (text) headers.push(text);
  });

  if (headers.length > 0) {
    textContent += headers.join('\t') + '\n';
    textContent += headers.map(() => '---').join('\t') + '\n';
  }

  const dataRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
  dataRows.forEach((row) => {
    const isGroupRow = isGroupedTableRow(row);
    const isTotalsRow = isTotalsTableRow(row);

    if (isGroupRow && !isTotalsRow) {
      return;
    }

    const rowData: string[] = [];
    row.querySelectorAll('td, th').forEach((cell) => {
      const hasOnlyButton = cell.querySelector('button') && !cell.textContent?.trim().replace(/[\s\n\r]+/g, '').length;
      rowData.push(hasOnlyButton ? '' : cell.textContent?.trim() || '');
    });

    if (rowData.length > 0 && rowData.some((cell) => cell !== '')) {
      textContent += rowData.join('\t') + '\n';
    }
  });

  if (headers.length === 0 && dataRows.length === 0) {
    textContent += table.textContent?.trim() || 'No data available';
  }

  return textContent.trim();
};

export interface DiscoveredTable {
  id: string;
  name: string;
  element: HTMLTableElement;
}

export const discoverPageTables = (root: ParentNode = document): DiscoveredTable[] => {
  const seen = new Set<HTMLTableElement>();
  const tables = Array.from(root.querySelectorAll('table')) as HTMLTableElement[];

  return tables
    .filter((table) => {
      if (seen.has(table)) return false;
      seen.add(table);

      const rows = table.querySelectorAll('tbody tr, tr').length;
      const cols = table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td').length;
      return rows > 0 || cols > 0;
    })
    .map((table, index) => {
      const name = extractTableName(table, `Table ${index + 1}`);
      return {
        id: table.getAttribute('data-table') || `${name}-${index + 1}`,
        name,
        element: table,
      };
    });
};

// ── File download helper ───────────────────────────────────────────────────
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const safeFilename = (name: string) =>
  name.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

const dateSuffix = () => new Date().toISOString().split('T')[0];

// ── Table → cleaned DOM clone (no grouped rows, no button-only cells) ──────
const cloneTableClean = (container: HTMLElement): HTMLElement => {
  const source = (container.querySelector('table') as HTMLElement | null) || container;
  const clone = source.cloneNode(true) as HTMLElement;

  // Remove grouped rows (keep totals)
  const tbody = clone.querySelector('tbody');
  if (tbody) {
    Array.from(tbody.querySelectorAll('tr')).forEach(row => {
      if (isGroupedTableRow(row) && !isTotalsTableRow(row)) row.remove();
    });
  }

  // Clear button-only cells (e.g. the copy-button header cell)
  clone.querySelectorAll('td, th').forEach(cell => {
    const hasOnlyBtn =
      cell.querySelector('button') !== null &&
      !(cell.textContent?.trim().replace(/[\s\n\r]+/g, ''));
    if (hasOnlyBtn) (cell as HTMLElement).innerHTML = '';
  });

  return clone;
};

// ── JSON extraction ────────────────────────────────────────────────────────
export const extractTableJSON = (
  container: HTMLElement,
  tableName: string,
): { title: string; exportedAt: string; headers: string[]; rows: Record<string, string>[] } => {
  const clone = cloneTableClean(container);

  const headers: string[] = [];
  clone
    .querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td')
    .forEach(cell => {
      const t = cell.textContent?.trim() || '';
      if (t) headers.push(t);
    });

  const rows: Record<string, string>[] = [];
  clone.querySelectorAll('tbody tr, tr:not(:first-child)').forEach(row => {
    if (isGroupedTableRow(row)) return;
    const cells: string[] = [];
    row.querySelectorAll('td, th').forEach(c => cells.push(c.textContent?.trim() || ''));
    if (!cells.some(v => v !== '')) return;

    const obj: Record<string, string> = {};
    cells.forEach((val, i) => {
      const key = headers[i] || `Column ${i + 1}`;
      if (key) obj[key] = val;
    });
    rows.push(obj);
  });

  return { title: tableName, exportedAt: new Date().toISOString(), headers, rows };
};

// ── Download as HTML ───────────────────────────────────────────────────────
export const downloadAsHTML = (container: HTMLElement, tableName: string) => {
  const clone = cloneTableClean(container);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tableName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           background: #f8fafc; margin: 0; padding: 24px; color: #374151; }
    .card { background: #fff; border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,.1); border: 1px solid #e2e8f0; overflow: hidden; }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
                   background: linear-gradient(135deg,#f8fafc,#f1f5f9); }
    .card-title  { margin: 0; font-size: 18px; font-weight: 600; color: #111827; }
    .card-sub    { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
    .wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: linear-gradient(135deg,#f8fafc,#f1f5f9);
               border-bottom: 2px solid #e2e8f0; }
    th { padding: 10px 14px; text-align: left; font-weight: 600; color: #374151;
         border-right: 1px solid #e5e7eb; white-space: nowrap; }
    th:last-child { border-right: none; }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    td { padding: 9px 14px; color: #374151; border-right: 1px solid #f3f4f6; }
    td:last-child { border-right: none; }
    tfoot tr { background: #1e293b; color: #f8fafc; font-weight: 600; }
    tfoot td { padding: 10px 14px; border-right: 1px solid #334155; }
    tfoot td:last-child { border-right: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">${tableName}</h2>
      <p class="card-sub">Exported ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
    <div class="wrap">${clone.outerHTML}</div>
  </div>
</body>
</html>`;

  downloadFile(html, `${safeFilename(tableName)}_${dateSuffix()}.html`, 'text/html');
};

// ── Download as JSON ───────────────────────────────────────────────────────
export const downloadAsJSON = (container: HTMLElement, tableName: string) => {
  const data = extractTableJSON(container, tableName);
  downloadFile(
    JSON.stringify(data, null, 2),
    `${safeFilename(tableName)}_${dateSuffix()}.json`,
    'application/json',
  );
};

// ── Download as Text ───────────────────────────────────────────────────────
export const downloadAsText = (container: HTMLElement, tableName: string) => {
  const text = extractTableTextFromContainer(container, tableName);
  downloadFile(
    text,
    `${safeFilename(tableName)}_${dateSuffix()}.txt`,
    'text/plain',
  );
};

// ── All-tables text ────────────────────────────────────────────────────────
export const buildAllTablesText = (root: ParentNode = document) => {
  const dateStamp = new Date().toLocaleDateString();
  const timeStamp = new Date().toLocaleTimeString();
  const parts: string[] = [];
  const tables = discoverPageTables(root);

  parts.push('All Metrics Export');
  parts.push(`Generated on: ${dateStamp} at ${timeStamp}`);
  parts.push(`Total Tables: ${tables.length}`);
  parts.push(`\n${'='.repeat(60)}\n`);

  tables.forEach((table) => {
    parts.push(`\n${'-'.repeat(40)}`);
    parts.push(`TABLE: ${table.name}`);
    parts.push(`${'-'.repeat(40)}`);
    parts.push(extractTableTextFromContainer(table.element, table.name));
    parts.push('\n');
  });

  return parts.join('\n');
};