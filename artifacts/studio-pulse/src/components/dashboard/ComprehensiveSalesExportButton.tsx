import React, { useCallback, useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { CalendarRange, Download, FileJson, FileSpreadsheet, FileText, LayoutTemplate, Printer, RefreshCw, Table2 } from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { useToast } from '@/hooks/use-toast';
import type { SalesData } from '@/types/dashboard';

interface TableExportData {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
}

interface ExportSection {
  key: string;
  heading: string;
  tabValue: string;
  tabLabel: string;
  tables: TableExportData[];
}

interface ExportBundle {
  title: string;
  generatedAt: string;
  locationName: string;
  locationSuffix: string;
  dateRange: {
    start: string;
    end: string;
    label: string;
  };
  sections: ExportSection[];
}

interface ComprehensiveSalesExportButtonProps {
  data: SalesData[];
  currentLocation: string;
  locationName: string;
  currentDateRange?: {
    start: string;
    end: string;
  };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  buttonClassName?: string;
  buttonLabel?: string;
  openRef?: React.RefObject<{ open: () => void }>;
  renderTrigger?: boolean;
}

type ExportFormat = 'csv' | 'xlsx' | 'txt' | 'json' | 'pdf';
type DateRangeMode = 'current' | 'custom';

interface ExportConfig {
  currentView: boolean;
  monthOnMonth: boolean;
  yearOnYear: boolean;
  productPerformance: boolean;
  categoryPerformance: boolean;
  soldByAnalysis: boolean;
  paymentMethodAnalysis: boolean;
  customerBehavior: boolean;
  allTabs: boolean;
}

const LOCATION_MAPPING: Record<string, string> = {
  all: 'All Locations',
  kwality: 'Kwality House, Kemps Corner',
  supreme: 'Supreme HQ, Bandra',
  kenkere: 'Kenkere House, Bengaluru',
  popup: 'Pop-up',
};

const TAB_EXPORT_LABELS: Record<keyof ExportConfig, string> = {
  currentView: 'Current active tab',
  monthOnMonth: 'Month-on-Month tab',
  yearOnYear: 'Year-on-Year tab',
  productPerformance: 'Products tab',
  categoryPerformance: 'Categories tab',
  soldByAnalysis: 'Sales Team tab',
  paymentMethodAnalysis: 'Payments tab',
  customerBehavior: 'Behavior tab',
  allTabs: 'All tabs',
};

const TAB_VALUE_MATCHERS: Record<Exclude<keyof ExportConfig, 'currentView' | 'allTabs'>, string[]> = {
  monthOnMonth: ['monthonmonth', 'month-on-month'],
  yearOnYear: ['yearonyear', 'year-on-year'],
  productPerformance: ['productperformance', 'product-performance'],
  categoryPerformance: ['categoryperformance', 'category-performance'],
  soldByAnalysis: ['soldbyanalysis', 'sold-by', 'soldby'],
  paymentMethodAnalysis: ['paymentmethodanalysis', 'payment-method', 'paymentmethod'],
  customerBehavior: ['customerbehavior', 'customer-behavior', 'behavior'],
};

const ALL_SALES_TAB_MATCHERS = Object.values(TAB_VALUE_MATCHERS).flat().map((value) => value.replace(/\s+/g, '').toLowerCase());

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV bundle',
  xlsx: 'Excel workbook',
  txt: 'Text report',
  json: 'JSON bundle',
  pdf: 'Print-ready PDF',
};

const waitForUiSettling = (ms = 900) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeFileSegment = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9\-_\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'export';

const escapeCsvCell = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeCellText = (value: string) => value.replace(/[↑↓▲▼]/g, '').replace(/\s+/g, ' ').trim();

const SUMMARY_ROW_LABEL_PATTERN = /^(grand\s+total|totals?|subtotals?)$/i;
const METRIC_SELECTOR_LABEL_PATTERN = /metrics:/i;

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

const normalizeTabValue = (value: string) => value.replace(/\s+/g, '').toLowerCase();

const getTabTriggerValue = (trigger: Element | null) => {
  if (!trigger) return 'current-view';

  const rawValue =
    trigger.getAttribute('data-value') ||
    trigger.getAttribute('value') ||
    trigger.getAttribute('aria-controls') ||
    trigger.getAttribute('id') ||
    trigger.textContent ||
    'current-view';

  const radixMatch = rawValue.match(/(?:content|trigger)-(.+)$/i);
  return (radixMatch?.[1] || rawValue).trim();
};

const getTabTriggerLabel = (trigger: Element | null) => trigger?.textContent?.trim() || getTabTriggerValue(trigger);

const matchesSalesTabMatcher = (candidate: string, matcher: string) => candidate === matcher || candidate.includes(matcher);

const isSalesAnalyticsTabTrigger = (trigger: Element | null) => {
  if (!trigger) return false;

  const normalizedValue = normalizeTabValue(getTabTriggerValue(trigger));
  const normalizedLabel = normalizeTabValue(getTabTriggerLabel(trigger));

  return ALL_SALES_TAB_MATCHERS.some((matcher) =>
    matchesSalesTabMatcher(normalizedValue, matcher) ||
    matchesSalesTabMatcher(normalizedLabel, matcher)
  );
};

const formatDateLabel = (value: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, 'MMM d, yyyy');
};

const buildDateRangeLabel = (range: { start: string; end: string }) => {
  if (!range.start && !range.end) return 'All available dates';
  return `${formatDateLabel(range.start)} → ${formatDateLabel(range.end)}`;
};

const isElementVisible = (element: HTMLElement) => {
  const style = window.getComputedStyle(element);
  return element.offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
};

const isInsideExportDialog = (element: Element) => Boolean(element.closest('[role="dialog"]'));

const getPanelForTabTrigger = (trigger: Element | null) => {
  const panelId = trigger?.getAttribute('aria-controls');
  return panelId ? document.getElementById(panelId) : null;
};

const findPreviousHeading = (element: Element | null): string | null => {
  let current: Element | null = element;
  while (current) {
    let sibling = current.previousElementSibling;
    while (sibling) {
      const heading = sibling.matches('h1, h2, h3, h4, h5, h6, [data-slot="card-title"]')
        ? sibling
        : sibling.querySelector('h1, h2, h3, h4, h5, h6, [data-slot="card-title"]');
      const text = heading?.textContent?.trim();
      if (text) return text;
      sibling = sibling.previousElementSibling;
    }
    current = current.parentElement;
  }
  return null;
};

const detectTableName = (tableElement: HTMLTableElement, index: number) => {
  const directCandidates = [
    tableElement.getAttribute('aria-label'),
    tableElement.getAttribute('data-table-name'),
    tableElement.closest('[data-table]')?.getAttribute('data-table'),
    tableElement.querySelector('caption')?.textContent,
    tableElement.closest('[data-table-name]')?.getAttribute('data-table-name'),
    tableElement.closest('[aria-label]')?.getAttribute('aria-label'),
    tableElement.closest('[data-slot="card"]')?.querySelector('[data-slot="card-title"]')?.textContent,
    tableElement.closest('.rounded-xl, .rounded-2xl, .rounded-lg, .card')?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent,
    findPreviousHeading(tableElement),
  ];

  const match = directCandidates
    .map((candidate) => candidate?.trim())
    .find((candidate) => candidate && candidate.length > 0 && candidate.toLowerCase() !== 'table');

  return match || `Displayed Table ${index + 1}`;
};

interface MetricButtonDescriptor {
  key: string;
  label: string;
  button: HTMLButtonElement;
}

interface ExpandedGroupState {
  buttonsToRestore: HTMLButtonElement[];
}

const isMetricButtonActive = (button: HTMLButtonElement) => {
  const className = button.className || '';
  return className.includes('from-slate-800') || (className.includes('text-white') && !className.includes('bg-slate-100'));
};

const findMetricButtonsForTable = (tableElement: HTMLTableElement): MetricButtonDescriptor[] => {
  let current: HTMLElement | null = tableElement;

  while (current) {
    let sibling = current.previousElementSibling as HTMLElement | null;

    while (sibling) {
      const candidates = [sibling, ...Array.from(sibling.querySelectorAll<HTMLElement>('div'))];

      for (const candidate of candidates) {
        if (!METRIC_SELECTOR_LABEL_PATTERN.test(candidate.textContent || '')) continue;

        const buttons = Array.from(candidate.querySelectorAll('button'))
          .map((button) => {
            const label = normalizeCellText(button.textContent || '');
            if (!label || label === 'Metrics:') return null;

            return {
              key: normalizeTabValue(label),
              label,
              button,
            };
          })
          .filter((button): button is MetricButtonDescriptor => Boolean(button));

        if (buttons.length > 1) {
          const seen = new Set<string>();
          return buttons.filter((button) => {
            if (seen.has(button.key)) return false;
            seen.add(button.key);
            return true;
          });
        }
      }

      sibling = sibling.previousElementSibling as HTMLElement | null;
    }

    current = current.parentElement;
  }

  return [];
};

const expandGroupedRowsForTable = async (tableElement: HTMLTableElement): Promise<ExpandedGroupState> => {
  const buttonsToRestore = Array.from(tableElement.querySelectorAll<HTMLButtonElement>('tbody tr button')).filter((button) =>
    Boolean(button.querySelector('svg.lucide-chevron-right, [data-lucide="chevron-right"]'))
  );

  for (const button of buttonsToRestore) {
    button.click();
  }

  if (buttonsToRestore.length > 0) {
    await waitForUiSettling(180);
  }

  return { buttonsToRestore };
};

const restoreGroupedRowsForTable = async (state: ExpandedGroupState) => {
  for (const button of state.buttonsToRestore) {
    button.click();
  }

  if (state.buttonsToRestore.length > 0) {
    await waitForUiSettling(120);
  }
};

const extractTableRows = (tableElement: HTMLTableElement, tableHasGroupedRows: boolean, headerTableRow: HTMLTableRowElement | null) => {
  return Array.from(tableElement.querySelectorAll('tr'))
    .filter((row): row is HTMLTableRowElement => row instanceof HTMLTableRowElement)
    .filter((row) => row !== headerTableRow)
    .map((row) => {
      const cells = Array.from(row.cells) as HTMLTableCellElement[];
      return {
        row,
        cells,
        values: cells.map((cell) => normalizeCellText(cell.textContent || '')),
      };
    })
    .filter(({ row, cells }) => !shouldExcludeExportRow(row, cells, tableHasGroupedRows))
    .map(({ values }) => values)
    .filter((row) => row.length > 0 && row.some((cell) => cell && cell !== '—' && cell !== '-'));
};

const buildTableExportData = (tableElement: HTMLTableElement, index: number, metricLabel?: string): TableExportData => {
  const baseName = detectTableName(tableElement, index);
  const id = `${sanitizeFileSegment(baseName).toLowerCase()}-${index + 1}`;
  const headerRow =
    tableElement.querySelector('thead tr') ||
    tableElement.querySelector('tr:has(th)') ||
    tableElement.querySelector('tr');

  const headerTableRow = headerRow instanceof HTMLTableRowElement ? headerRow : null;
  const tableHasGroupedRows = Boolean(tableElement.querySelector('tbody tr button'));
  const headers = headerTableRow
    ? Array.from(headerTableRow.cells).map((cell) => normalizeCellText(cell.textContent || ''))
    : [];

  return {
    id,
    name: metricLabel ? `${baseName} — ${metricLabel}` : baseName,
    headers,
    rows: extractTableRows(tableElement, tableHasGroupedRows, headerTableRow),
  };
};

const shouldExcludeExportRow = (
  row: HTMLTableRowElement,
  cells: HTMLTableCellElement[],
  tableHasGroupedRows: boolean
) => {
  const normalizedCells = cells.map((cell) => normalizeCellText(cell.textContent || ''));
  const firstNonEmptyCell = normalizedCells.find(Boolean) || '';
  const hasToggleButton = Boolean(row.querySelector('button'));
  const hasSummaryLabel = SUMMARY_ROW_LABEL_PATTERN.test(firstNonEmptyCell);
  const hasWideGroupingCell = cells.some((cell) => cell.colSpan > 1);

  if (hasSummaryLabel || hasWideGroupingCell) {
    return true;
  }

  if (tableHasGroupedRows && hasToggleButton) {
    return true;
  }

  return false;
};

const buildCsvContent = (bundle: ExportBundle, section: ExportSection, table: TableExportData) => {
  const lines: string[] = [
    `# ${bundle.title}`,
    `# Generated: ${new Date(bundle.generatedAt).toLocaleString()}`,
    `# Location: ${bundle.locationName}`,
    `# Date Range: ${bundle.dateRange.label}`,
    `# Section: ${section.heading}`,
    `# Table: ${table.name}`,
    '',
  ];

  if (table.headers.length > 0) {
    lines.push(table.headers.map(escapeCsvCell).join(','));
  }

  table.rows.forEach((row) => {
    lines.push(row.map((cell) => escapeCsvCell(cell)).join(','));
  });

  return lines.join('\n');
};

const buildTextReport = (bundle: ExportBundle) => {
  const lines: string[] = [
    '════════════════════════════════════════════════════════════',
    ` ${bundle.title}`,
    '════════════════════════════════════════════════════════════',
    '',
    `Generated: ${new Date(bundle.generatedAt).toLocaleString()}`,
    `Location: ${bundle.locationName}`,
    `Date Range: ${bundle.dateRange.label}`,
    `Sections: ${bundle.sections.length}`,
    '',
  ];

  bundle.sections.forEach((section, sectionIndex) => {
    lines.push(`## ${sectionIndex + 1}. ${section.heading}`);
    lines.push('');
    section.tables.forEach((table, tableIndex) => {
      lines.push(`### ${sectionIndex + 1}.${tableIndex + 1} ${table.name}`);
      lines.push(`Columns: ${table.headers.length} | Rows: ${table.rows.length}`);
      lines.push('');
      if (table.headers.length > 0) {
        lines.push(table.headers.join(' | '));
        lines.push(table.headers.map(() => '---').join(' | '));
      }
      table.rows.forEach((row) => lines.push(row.join(' | ')));
      lines.push('');
    });
  });

  return lines.join('\n');
};

const buildPrintableHtml = (bundle: ExportBundle) => {
  const styles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #0f172a; }
      h1 { font-size: 24px; margin-bottom: 12px; }
      h2 { font-size: 18px; margin: 28px 0 10px; color: #1e293b; }
      h3 { font-size: 14px; margin: 16px 0 8px; color: #475569; }
      .meta { font-size: 12px; color: #64748b; margin-bottom: 4px; }
      table { border-collapse: collapse; width: 100%; margin: 10px 0 20px; font-size: 12px; }
      th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
      thead th { background: #0f172a; color: white; }
      .page-break { page-break-after: always; }
    </style>
  `;

  let html = `<!doctype html><html><head><meta charset="utf-8" />${styles}<title>${escapeHtml(bundle.title)}</title></head><body>`;
  html += `<h1>${escapeHtml(bundle.title)}</h1>`;
  html += `<div class="meta">Generated: ${escapeHtml(new Date(bundle.generatedAt).toLocaleString())}</div>`;
  html += `<div class="meta">Location: ${escapeHtml(bundle.locationName)}</div>`;
  html += `<div class="meta">Date Range: ${escapeHtml(bundle.dateRange.label)}</div>`;

  bundle.sections.forEach((section, sectionIndex) => {
    html += `<h2>${escapeHtml(section.heading)}</h2>`;
    section.tables.forEach((table) => {
      html += `<h3>${escapeHtml(table.name)}</h3>`;
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
    if (sectionIndex < bundle.sections.length - 1) {
      html += '<div class="page-break"></div>';
    }
  });

  html += '</body></html>';
  return html;
};

export const ComprehensiveSalesExportButton: React.FC<ComprehensiveSalesExportButtonProps> = (props) => {
  const {
    currentLocation,
    locationName,
    currentDateRange = { start: '', end: '' },
    onDateRangeChange,
    buttonVariant = 'outline',
    buttonSize = 'sm',
    buttonClassName,
    buttonLabel,
    openRef,
    renderTrigger = true,
  } = props;

  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [fileName, setFileName] = useState(`sales-displayed-tables-${format(new Date(), 'yyyy-MM-dd')}`);
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('current');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [visibleTables, setVisibleTables] = useState<TableExportData[]>([]);
  const [selectedVisibleTableIds, setSelectedVisibleTableIds] = useState<string[]>([]);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    currentView: true,
    monthOnMonth: false,
    yearOnYear: false,
    productPerformance: false,
    categoryPerformance: false,
    soldByAnalysis: false,
    paymentMethodAnalysis: false,
    customerBehavior: false,
    allTabs: false,
  });

  useEffect(() => {
    if (openRef) {
      openRef.current = {
        open: () => setIsDialogOpen(true),
      };
    }
  }, [openRef]);

  const getCurrentTabInfo = useCallback(() => {
    const activeTab = Array.from(document.querySelectorAll('[role="tab"][data-state="active"]')).find((tab) => isSalesAnalyticsTabTrigger(tab)) || null;
    return {
      tabValue: getTabTriggerValue(activeTab),
      tabText: getTabTriggerLabel(activeTab),
    };
  }, []);

  const getVisibleTableElements = useCallback((root?: ParentNode | null, requireVisibility = true) => {
    const scopedRoot = root ?? document;
    const visibleTableElements: HTMLTableElement[] = [];

    scopedRoot.querySelectorAll('table').forEach((table) => {
        const tableElement = table as HTMLTableElement;
        if (isInsideExportDialog(tableElement)) {
          return;
        }
        if (!requireVisibility || isElementVisible(tableElement)) {
          visibleTableElements.push(tableElement);
        }
    });

    return visibleTableElements;
  }, []);

  const extractAllTableData = useCallback(async (options?: { allowedIds?: Set<string>; expandMetricTables?: boolean; root?: ParentNode | null; requireVisibility?: boolean }) => {
    const allowedIds = options?.allowedIds;
    const expandMetricTables = options?.expandMetricTables ?? true;
    const visibleTableElements = getVisibleTableElements(options?.root, options?.requireVisibility ?? true);
    const collectedTables: TableExportData[] = [];

    for (const [index, tableElement] of visibleTableElements.entries()) {
      const expandedState = await expandGroupedRowsForTable(tableElement);
      const baseTable = buildTableExportData(tableElement, index);
      if (allowedIds && !allowedIds.has(baseTable.id)) {
        await restoreGroupedRowsForTable(expandedState);
        continue;
      }

      if (!expandMetricTables) {
        if (baseTable.rows.length > 0) {
          collectedTables.push(baseTable);
        }
        await restoreGroupedRowsForTable(expandedState);
        continue;
      }

      const metricButtons = findMetricButtonsForTable(tableElement);
      if (metricButtons.length <= 1) {
        if (baseTable.rows.length > 0) {
          collectedTables.push(baseTable);
        }
        await restoreGroupedRowsForTable(expandedState);
        continue;
      }

      const originalMetric = metricButtons.find(({ button }) => isMetricButtonActive(button)) || metricButtons[0];

      for (const metricButton of metricButtons) {
        const liveMetricButton = findMetricButtonsForTable(tableElement).find((button) => button.key === metricButton.key);
        liveMetricButton?.button.click();
        await waitForUiSettling(220);

        const metricVariantTable = buildTableExportData(tableElement, index, metricButton.label);
        if (metricVariantTable.rows.length > 0) {
          collectedTables.push(metricVariantTable);
        }
      }

      const liveOriginalMetricButton = findMetricButtonsForTable(tableElement).find((button) => button.key === originalMetric.key);
      liveOriginalMetricButton?.button.click();
      await waitForUiSettling(180);
      await restoreGroupedRowsForTable(expandedState);
    }

    return collectedTables;
  }, [getVisibleTableElements]);

  const refreshVisibleTables = useCallback(async () => {
    const activeTab = Array.from(document.querySelectorAll('[role="tab"][data-state="active"]')).find((tab) => isSalesAnalyticsTabTrigger(tab)) || null;
    const activePanel = getPanelForTabTrigger(activeTab);
    let tables = await extractAllTableData({ expandMetricTables: false, root: activePanel, requireVisibility: false });

    if (tables.length === 0 && activePanel) {
      tables = await extractAllTableData({ expandMetricTables: false, root: activePanel, requireVisibility: true });
    }

    if (tables.length === 0) {
      tables = await extractAllTableData({ expandMetricTables: false, requireVisibility: true });
    }

    setVisibleTables(tables);
    setSelectedVisibleTableIds((previous) => {
      const availableIds = new Set(tables.map((table) => table.id));
      const preserved = previous.filter((id) => availableIds.has(id));
      return preserved.length > 0 ? preserved : tables.map((table) => table.id);
    });
    return tables;
  }, [extractAllTableData]);

  useEffect(() => {
    if (!isDialogOpen) return;
    setCustomDateRange(
      currentDateRange.start && currentDateRange.end
        ? { from: new Date(currentDateRange.start), to: new Date(currentDateRange.end) }
        : undefined
    );
    void refreshVisibleTables();
  }, [currentDateRange.end, currentDateRange.start, isDialogOpen, refreshVisibleTables]);

  const currentDateRangeLabel = useMemo(() => buildDateRangeLabel(currentDateRange), [currentDateRange]);

  const toggleExportSection = (section: keyof ExportConfig) => {
    setExportConfig((previous) => {
      if (section === 'allTabs') {
        return {
          ...previous,
          allTabs: !previous.allTabs,
        };
      }
      return {
        ...previous,
        [section]: !previous[section],
        allTabs: false,
      };
    });
  };

  const shouldExportTab = useCallback(
    (tabValue: string, tabLabel: string) => {
      if (exportConfig.allTabs) return true;

      const normalizedValue = normalizeTabValue(tabValue);
      const normalizedLabel = normalizeTabValue(tabLabel);

      return (Object.entries(TAB_VALUE_MATCHERS) as Array<[Exclude<keyof ExportConfig, 'currentView' | 'allTabs'>, string[]]>).some(
        ([key, matchers]) =>
          exportConfig[key] &&
          matchers.some((matcher) => {
            const normalizedMatcher = normalizeTabValue(matcher);
            return (
              matchesSalesTabMatcher(normalizedValue, normalizedMatcher) ||
              matchesSalesTabMatcher(normalizedLabel, normalizedMatcher)
            );
          })
      );
    },
    [exportConfig]
  );

  const collectExportSections = useCallback(async () => {
    const sections: ExportSection[] = [];
    const seenTabs = new Set<string>();
    const originalActiveTab = (Array.from(document.querySelectorAll('[role="tab"][data-state="active"]')).find((tab) => isSalesAnalyticsTabTrigger(tab)) || null) as HTMLElement | null;
    const { tabValue: activeTabValue, tabText: activeTabText } = getCurrentTabInfo();
    const selectedCurrentTableIds = new Set(selectedVisibleTableIds);

    if (exportConfig.currentView) {
      const currentPanel = getPanelForTabTrigger(originalActiveTab);
      let tables = await extractAllTableData({
        allowedIds: selectedCurrentTableIds.size > 0 ? selectedCurrentTableIds : undefined,
        expandMetricTables: true,
        root: currentPanel,
        requireVisibility: false,
      });
      if (tables.length === 0) {
        tables = await extractAllTableData({
          allowedIds: selectedCurrentTableIds.size > 0 ? selectedCurrentTableIds : undefined,
          expandMetricTables: true,
          root: currentPanel,
          requireVisibility: true,
        });
      }
      if (tables.length > 0) {
        sections.push({
          key: 'currentView',
          heading: `Current View – ${activeTabText}`,
          tabValue: activeTabValue,
          tabLabel: activeTabText,
          tables,
        });
        seenTabs.add(activeTabValue);
      }
    }

    const tabTriggers = Array.from(document.querySelectorAll('[role="tab"]')).filter((trigger) => isSalesAnalyticsTabTrigger(trigger)) as HTMLElement[];
    for (const trigger of tabTriggers) {
      const tabValue = getTabTriggerValue(trigger);
      const tabLabel = getTabTriggerLabel(trigger);
      if (seenTabs.has(tabValue)) continue;
      if (!shouldExportTab(tabValue, tabLabel)) continue;

      trigger.click();
      await waitForUiSettling();

      const triggerPanel = getPanelForTabTrigger(trigger);
      let tables = await extractAllTableData({ expandMetricTables: true, root: triggerPanel, requireVisibility: false });
      if (tables.length === 0) {
        tables = await extractAllTableData({ expandMetricTables: true, root: triggerPanel, requireVisibility: true });
      }
      if (tables.length > 0) {
        sections.push({
          key: tabValue,
          heading: `Tab – ${tabLabel}`,
          tabValue,
          tabLabel,
          tables,
        });
      }
    }

    if (originalActiveTab) {
      originalActiveTab.click();
      await waitForUiSettling(350);
      await refreshVisibleTables();
    }

    return sections;
  }, [exportConfig.currentView, extractAllTableData, getCurrentTabInfo, refreshVisibleTables, selectedVisibleTableIds, shouldExportTab]);

  const exportCsvBundle = useCallback(async (bundle: ExportBundle, baseFileName: string) => {
    const allTables = bundle.sections.flatMap((section) => section.tables.map((table) => ({ section, table })));
    if (allTables.length === 1) {
      const { section, table } = allTables[0];
      downloadBlob(new Blob([buildCsvContent(bundle, section, table)], { type: 'text/csv;charset=utf-8;' }), `${baseFileName}.csv`);
      return;
    }

    const zip = new JSZip();
    zip.file(
      'README.txt',
      [
        bundle.title,
        `Generated: ${new Date(bundle.generatedAt).toLocaleString()}`,
        `Location: ${bundle.locationName}`,
        `Date Range: ${bundle.dateRange.label}`,
        `Sections: ${bundle.sections.length}`,
      ].join('\n')
    );

    bundle.sections.forEach((section, sectionIndex) => {
      const folderName = `${String(sectionIndex + 1).padStart(2, '0')}-${sanitizeFileSegment(section.tabLabel)}`;
      const folder = zip.folder(folderName);
      section.tables.forEach((table, tableIndex) => {
        folder?.file(`${String(tableIndex + 1).padStart(2, '0')}-${sanitizeFileSegment(table.name)}.csv`, buildCsvContent(bundle, section, table));
      });
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${baseFileName}.zip`);
  }, []);

  const exportJsonBundle = useCallback((bundle: ExportBundle, baseFileName: string) => {
    downloadBlob(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8;' }), `${baseFileName}.json`);
  }, []);

  const exportTextBundle = useCallback((bundle: ExportBundle, baseFileName: string) => {
    downloadBlob(new Blob([buildTextReport(bundle)], { type: 'text/plain;charset=utf-8;' }), `${baseFileName}.txt`);
  }, []);

  const exportWorkbookBundle = useCallback((bundle: ExportBundle, baseFileName: string) => {
    const workbook = XLSX.utils.book_new();
    const usedSheetNames = new Set<string>();

    const createUniqueSheetName = (rawName: string) => {
      const baseName = rawName.replace(/[\\/?*\[\]:]/g, '').slice(0, 31) || 'Sheet';
      if (!usedSheetNames.has(baseName)) {
        usedSheetNames.add(baseName);
        return baseName;
      }

      let suffix = 2;
      let nextName = `${baseName.slice(0, 28)}-${suffix}`;
      while (usedSheetNames.has(nextName)) {
        suffix += 1;
        nextName = `${baseName.slice(0, 28)}-${suffix}`;
      }
      usedSheetNames.add(nextName);
      return nextName;
    };

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['Report', bundle.title],
      ['Generated', new Date(bundle.generatedAt).toLocaleString()],
      ['Location', bundle.locationName],
      ['Date Range', bundle.dateRange.label],
      ['Sections', bundle.sections.length],
    ]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, createUniqueSheetName('Summary'));

    bundle.sections.forEach((section) => {
      section.tables.forEach((table) => {
        const sheet = XLSX.utils.aoa_to_sheet([table.headers, ...table.rows]);
        XLSX.utils.book_append_sheet(workbook, sheet, createUniqueSheetName(`${section.tabLabel} ${table.name}`));
      });
    });

    XLSX.writeFile(workbook, `${baseFileName}.xlsx`);
  }, []);

  const exportPdfBundle = useCallback((bundle: ExportBundle) => {
    const html = buildPrintableHtml(bundle);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups to generate the PDF.');
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 350);
  }, []);

  const handleExport = useCallback(async () => {
    if (dateRangeMode === 'custom' && (!customDateRange?.from || !customDateRange?.to)) {
      toast({
        title: 'Pick a full date range',
        description: 'Choose both a start and end date for the custom export range.',
        variant: 'destructive',
      });
      return;
    }

    if (exportConfig.currentView && visibleTables.length > 0 && selectedVisibleTableIds.length === 0) {
      toast({
        title: 'No tables selected',
        description: 'Pick at least one visible table from the current tab, or disable current-view export.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    const originalDateRange = { ...currentDateRange };
    const overrideDateRange =
      dateRangeMode === 'custom' && customDateRange?.from && customDateRange?.to
        ? {
            start: format(customDateRange.from, 'yyyy-MM-dd'),
            end: format(customDateRange.to, 'yyyy-MM-dd'),
          }
        : null;
    const wasDialogOpen = isDialogOpen;

    try {
      if (wasDialogOpen) {
        setIsDialogOpen(false);
        await waitForUiSettling(150);
      }

      if (overrideDateRange && onDateRangeChange) {
        onDateRangeChange(overrideDateRange);
        await waitForUiSettling(950);
        await refreshVisibleTables();
      }

      const sections = await collectExportSections();
      if (sections.length === 0) {
        toast({
          title: 'No displayed tables found',
          description: 'There were no rendered table rows to export for the chosen scope.',
          variant: 'destructive',
        });
        return;
      }

      const appliedDateRange = overrideDateRange || currentDateRange;
      const dateRangeLabel = buildDateRangeLabel(appliedDateRange);
      const locationSuffix = currentLocation === 'all' ? 'all-locations' : sanitizeFileSegment(LOCATION_MAPPING[currentLocation] || currentLocation).toLowerCase();
      const safeBaseFileName = sanitizeFileSegment(fileName || `sales-displayed-tables-${format(new Date(), 'yyyy-MM-dd')}`);

      const bundle: ExportBundle = {
        title: `Sales Analytics Display Export – ${locationName}`,
        generatedAt: new Date().toISOString(),
        locationName,
        locationSuffix,
        dateRange: {
          ...appliedDateRange,
          label: dateRangeLabel,
        },
        sections,
      };

      const fullFileName = `${safeBaseFileName}-${locationSuffix}-${format(new Date(), 'yyyyMMdd-HHmm')}`;

      if (exportFormat === 'csv') {
        await exportCsvBundle(bundle, fullFileName);
      } else if (exportFormat === 'xlsx') {
        exportWorkbookBundle(bundle, fullFileName);
      } else if (exportFormat === 'txt') {
        exportTextBundle(bundle, fullFileName);
      } else if (exportFormat === 'json') {
        exportJsonBundle(bundle, fullFileName);
      } else {
        exportPdfBundle(bundle);
      }

      toast({
        title: 'Sales export ready',
        description: `${FORMAT_LABELS[exportFormat]} created from displayed table output${overrideDateRange ? ` for ${dateRangeLabel}` : ''}.`,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Something went sideways while exporting the sales tables.',
        variant: 'destructive',
      });

      if (wasDialogOpen) {
        setIsDialogOpen(true);
      }
    } finally {
      if (overrideDateRange && onDateRangeChange) {
        onDateRangeChange(originalDateRange);
        await waitForUiSettling(450);
        await refreshVisibleTables();
      }
      setIsExporting(false);
    }
  }, [
    collectExportSections,
    currentDateRange,
    currentLocation,
    customDateRange?.from,
    customDateRange?.to,
    dateRangeMode,
    exportConfig.currentView,
    exportCsvBundle,
    exportFormat,
    exportJsonBundle,
    exportPdfBundle,
    exportTextBundle,
    exportWorkbookBundle,
    fileName,
    locationName,
    onDateRangeChange,
    refreshVisibleTables,
    selectedVisibleTableIds.length,
    toast,
    visibleTables.length,
  ]);

  const selectedScopeCount =
    Number(exportConfig.currentView) +
    Number(exportConfig.monthOnMonth) +
    Number(exportConfig.yearOnYear) +
    Number(exportConfig.productPerformance) +
    Number(exportConfig.categoryPerformance) +
    Number(exportConfig.soldByAnalysis) +
    Number(exportConfig.paymentMethodAnalysis) +
    Number(exportConfig.customerBehavior) +
    Number(exportConfig.allTabs);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {renderTrigger !== false && (
        <DialogTrigger asChild>
          <Button
            variant={buttonVariant}
            size={buttonSize}
            className={cn('gap-2', buttonClassName)}
            style={{ borderColor: 'var(--hero-accent, rgba(255,255,255,0.3))' }}
          >
            <Download className="h-4 w-4" />
            {buttonLabel ?? 'Export Sales Tables'}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            Better Sales Export
          </DialogTitle>
          <DialogDescription>
            Export the rendered sales tables exactly as they appear in the chosen tab scope — with optional custom export dates, and without dumping raw source rows into the mix.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sales-export-format">Format</Label>
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                <SelectTrigger id="sales-export-format">
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel workbook (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV bundle (.csv/.zip)</SelectItem>
                  <SelectItem value="txt">Text report (.txt)</SelectItem>
                  <SelectItem value="json">JSON bundle (.json)</SelectItem>
                  <SelectItem value="pdf">Print-ready PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sales-export-file-name">File name prefix</Label>
              <Input
                id="sales-export-file-name"
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                placeholder="sales-displayed-tables"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <CalendarRange className="h-4 w-4 text-blue-600" />
              Export date range
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-start gap-3 rounded-lg border bg-white p-3 cursor-pointer">
                <input
                  type="radio"
                  className="mt-1"
                  checked={dateRangeMode === 'current'}
                  onChange={() => setDateRangeMode('current')}
                />
                <div>
                  <div className="font-medium text-slate-900">Use current displayed range</div>
                  <div className="text-sm text-slate-600">{currentDateRangeLabel}</div>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border bg-white p-3 cursor-pointer">
                <input
                  type="radio"
                  className="mt-1"
                  checked={dateRangeMode === 'custom'}
                  onChange={() => setDateRangeMode('custom')}
                />
                <div>
                  <div className="font-medium text-slate-900">Use custom export range</div>
                  <div className="text-sm text-slate-600">Temporarily applies the range, exports displayed tables, then restores the UI.</div>
                </div>
              </label>
            </div>

            {dateRangeMode === 'custom' && <DatePickerWithRange value={customDateRange} onChange={setCustomDateRange} />}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Tab scope</Label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(Object.keys(TAB_EXPORT_LABELS) as Array<keyof ExportConfig>).map((key) => (
                <label key={key} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                  <Checkbox checked={exportConfig[key]} onCheckedChange={() => toggleExportSection(key)} />
                  <span className="text-sm text-slate-800">{TAB_EXPORT_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>

          {exportConfig.currentView && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-medium text-slate-900">
                    <Table2 className="h-4 w-4 text-emerald-600" />
                    Current tab tables
                  </div>
                  <div className="text-sm text-slate-600">
                    Active tab: <span className="font-medium">{getCurrentTabInfo().tabText}</span>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={refreshVisibleTables} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh tables
                </Button>
              </div>

              {visibleTables.length > 0 ? (
                <div className="space-y-2">
                  {visibleTables.map((table) => {
                    const isChecked = selectedVisibleTableIds.includes(table.id);
                    return (
                      <label key={table.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => {
                              setSelectedVisibleTableIds((previous) =>
                                previous.includes(table.id)
                                  ? previous.filter((id) => id !== table.id)
                                  : [...previous, table.id]
                              );
                            }}
                          />
                          <div>
                            <div className="font-medium text-slate-900">{table.name}</div>
                            <div className="text-xs text-slate-500">
                              {table.rows.length} rows • {table.headers.length} columns
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No visible tables detected yet. Open the target tab, then refresh.</div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <div className="font-medium mb-2">Export summary</div>
            <ul className="space-y-1 text-blue-800">
              <li>Format: <span className="font-medium">{FORMAT_LABELS[exportFormat]}</span></li>
              <li>Date range: <span className="font-medium">{dateRangeMode === 'custom' && customDateRange?.from && customDateRange?.to ? `${format(customDateRange.from, 'MMM d, yyyy')} → ${format(customDateRange.to, 'MMM d, yyyy')}` : currentDateRangeLabel}</span></li>
              <li>Tab scope selected: <span className="font-medium">{selectedScopeCount}</span></li>
              <li>Current-view tables selected: <span className="font-medium">{selectedVisibleTableIds.length || visibleTables.length || 0}</span></li>
              <li>Source: <span className="font-medium">displayed table cells only</span></li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              {isExporting ? (
                <>
                  <BrandSpinner size="xs" />
                  Exporting...
                </>
              ) : (
                <>
                  {exportFormat === 'xlsx' || exportFormat === 'csv' ? <FileSpreadsheet className="h-4 w-4" /> : null}
                  {exportFormat === 'txt' ? <FileText className="h-4 w-4" /> : null}
                  {exportFormat === 'json' ? <FileJson className="h-4 w-4" /> : null}
                  {exportFormat === 'pdf' ? <Printer className="h-4 w-4" /> : null}
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
