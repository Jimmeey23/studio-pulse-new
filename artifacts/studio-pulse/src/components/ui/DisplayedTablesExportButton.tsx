import React, { useCallback, useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Download, FileJson, FileSpreadsheet, FileText, LayoutTemplate, Printer, RefreshCw, Table2 } from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { useToast } from '@/hooks/use-toast';

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
  contextLabel?: string;
  sections: ExportSection[];
}

export interface DisplayedTableExportTabOption {
  key: string;
  label: string;
  matchers: string[];
}

interface DisplayedTablesExportButtonProps {
  analyticsName: string;
  tabOptions: DisplayedTableExportTabOption[];
  defaultFileName?: string;
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  buttonClassName?: string;
  buttonLabel?: string;
  openRef?: React.RefObject<{ open: () => void }>;
  renderTrigger?: boolean;
  contextLabel?: string;
  dialogDescription?: string;
}

type ExportFormat = 'csv' | 'xlsx' | 'txt' | 'json' | 'pdf';

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV bundle',
  xlsx: 'Excel workbook',
  txt: 'Text report',
  json: 'JSON bundle',
  pdf: 'Print-ready PDF',
};

const waitForUiSettling = (ms = 750) => new Promise((resolve) => setTimeout(resolve, ms));

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

const normalizeTabValue = (value: string) => value.replace(/\s+/g, '').toLowerCase();

const SUMMARY_ROW_LABEL_PATTERN = /^(grand\s+total|totals?|subtotals?)$/i;
const NON_METRIC_BUTTON_LABEL_PATTERN = /^(copy|refresh|download|reset|cancel|export|analytics|previous|next|all\s+tabs?)$/i;

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

const isElementVisible = (element: HTMLElement) => {
  const style = window.getComputedStyle(element);
  return element.offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
};

const isInsideExportDialog = (element: Element) => Boolean(element.closest('[role="dialog"]'));

const getPanelForTabTrigger = (trigger: Element | null) => {
  const panelId = trigger?.getAttribute('aria-controls');
  return panelId ? document.getElementById(panelId) : null;
};

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
    tableElement.closest('[data-table-name]')?.getAttribute('data-table-name'),
    tableElement.closest('[data-table]')?.getAttribute('data-table'),
    tableElement.querySelector('caption')?.textContent,
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
  const dataState = button.getAttribute('data-state');
  return (
    dataState === 'active' ||
    className.includes('from-slate-800') ||
    className.includes('bg-black') ||
    className.includes('bg-blue-600') ||
    className.includes('bg-purple-800') ||
    (className.includes('text-white') && !className.includes('bg-white'))
  );
};

const getCandidateMetricContainers = (tableElement: HTMLTableElement): HTMLElement[] => {
  const containers: HTMLElement[] = [];
  let current: HTMLElement | null = tableElement.parentElement;
  let depth = 0;

  while (current && depth < 4) {
    let sibling = current.previousElementSibling as HTMLElement | null;
    while (sibling) {
      containers.push(sibling);
      sibling = sibling.previousElementSibling as HTMLElement | null;
    }
    current = current.parentElement;
    depth += 1;
  }

  return containers;
};

const extractMetricButtonsFromContainer = (container: HTMLElement): MetricButtonDescriptor[] => {
  const buttonGroups = [container, ...Array.from(container.querySelectorAll<HTMLElement>('div'))];

  for (const group of buttonGroups) {
    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('button'))
      .filter((button) => button.getAttribute('role') !== 'tab')
      .map((button) => {
        const label = normalizeCellText(button.textContent || '');
        if (!label || label.length > 28 || NON_METRIC_BUTTON_LABEL_PATTERN.test(label)) {
          return null;
        }

        return {
          key: normalizeTabValue(label),
          label,
          button,
        };
      })
      .filter((button): button is MetricButtonDescriptor => Boolean(button));

    if (buttons.length >= 2 && buttons.length <= 12) {
      const unique = new Map<string, MetricButtonDescriptor>();
      buttons.forEach((button) => {
        if (!unique.has(button.key)) unique.set(button.key, button);
      });
      const normalizedButtons = Array.from(unique.values());
      if (normalizedButtons.length >= 2) {
        return normalizedButtons;
      }
    }
  }

  return [];
};

const findMetricButtonsForTable = (tableElement: HTMLTableElement): MetricButtonDescriptor[] => {
  const containers = getCandidateMetricContainers(tableElement);
  for (const container of containers) {
    const result = extractMetricButtonsFromContainer(container);
    if (result.length >= 2) {
      return result;
    }
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
    await waitForUiSettling(160);
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

const buildCsvContent = (bundle: ExportBundle, section: ExportSection, table: TableExportData) => {
  const lines: string[] = [
    `# ${bundle.title}`,
    `# Generated: ${new Date(bundle.generatedAt).toLocaleString()}`,
    bundle.contextLabel ? `# Context: ${bundle.contextLabel}` : undefined,
    `# Section: ${section.heading}`,
    `# Table: ${table.name}`,
    '',
  ].filter(Boolean) as string[];

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
    bundle.contextLabel ? `Context: ${bundle.contextLabel}` : undefined,
    `Sections: ${bundle.sections.length}`,
    '',
  ].filter(Boolean) as string[];

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
  if (bundle.contextLabel) {
    html += `<div class="meta">Context: ${escapeHtml(bundle.contextLabel)}</div>`;
  }

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

export const DisplayedTablesExportButton: React.FC<DisplayedTablesExportButtonProps> = ({
  analyticsName,
  tabOptions,
  defaultFileName,
  buttonVariant = 'outline',
  buttonSize = 'sm',
  buttonClassName,
  buttonLabel,
  openRef,
  renderTrigger = true,
  contextLabel,
  dialogDescription,
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [fileName, setFileName] = useState(defaultFileName || `${sanitizeFileSegment(analyticsName).toLowerCase()}-displayed-tables-${format(new Date(), 'yyyy-MM-dd')}`);
  const [currentViewEnabled, setCurrentViewEnabled] = useState(true);
  const [allTabsEnabled, setAllTabsEnabled] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tabOptions.map((tab) => [tab.key, false]))
  );
  const [visibleTables, setVisibleTables] = useState<TableExportData[]>([]);
  const [selectedVisibleTableIds, setSelectedVisibleTableIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedTabs((previous) => {
      const next = Object.fromEntries(tabOptions.map((tab) => [tab.key, previous[tab.key] ?? false]));
      return next;
    });
  }, [tabOptions]);

  useEffect(() => {
    if (openRef) {
      openRef.current = {
        open: () => setIsDialogOpen(true),
      };
    }
  }, [openRef]);

  const findMatchingTabOption = useCallback(
    (trigger: Element | null) => {
      const normalizedValue = normalizeTabValue(getTabTriggerValue(trigger));
      const normalizedLabel = normalizeTabValue(getTabTriggerLabel(trigger));

      return tabOptions.find((option) =>
        option.matchers.some((matcher) => {
          const normalizedMatcher = normalizeTabValue(matcher);
          return (
            normalizedValue === normalizedMatcher ||
            normalizedLabel === normalizedMatcher ||
            normalizedValue.includes(normalizedMatcher) ||
            normalizedLabel.includes(normalizedMatcher)
          );
        })
      );
    },
    [tabOptions]
  );

  const isRelevantTabTrigger = useCallback((trigger: Element | null) => Boolean(findMatchingTabOption(trigger)), [findMatchingTabOption]);

  const getCurrentTabInfo = useCallback(() => {
    const activeTab = Array.from(document.querySelectorAll('[role="tab"][data-state="active"]')).find((tab) => isRelevantTabTrigger(tab)) || null;
    const matchingOption = findMatchingTabOption(activeTab);
    return {
      tabValue: getTabTriggerValue(activeTab),
      tabText: matchingOption?.label || getTabTriggerLabel(activeTab) || 'Current View',
    };
  }, [findMatchingTabOption, isRelevantTabTrigger]);

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

  const extractAllTableData = useCallback(
    async (options?: { allowedIds?: Set<string>; expandMetricTables?: boolean; root?: ParentNode | null; requireVisibility?: boolean }) => {
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
        const seenMetricTables = new Set<string>();

        for (const metricButton of metricButtons) {
          const liveMetricButton = findMetricButtonsForTable(tableElement).find((button) => button.key === metricButton.key);
          liveMetricButton?.button.click();
          await waitForUiSettling(220);

          const metricVariantTable = buildTableExportData(tableElement, index, metricButton.label);
          const metricTableKey = `${metricVariantTable.name}-${metricVariantTable.rows.length}`;
          if (metricVariantTable.rows.length > 0 && !seenMetricTables.has(metricTableKey)) {
            collectedTables.push(metricVariantTable);
            seenMetricTables.add(metricTableKey);
          }
        }

        const liveOriginalMetricButton = findMetricButtonsForTable(tableElement).find((button) => button.key === originalMetric.key);
        liveOriginalMetricButton?.button.click();
        await waitForUiSettling(180);
        await restoreGroupedRowsForTable(expandedState);
      }

      return collectedTables;
    },
    [getVisibleTableElements]
  );

  const refreshVisibleTables = useCallback(async () => {
    const activeTab = Array.from(document.querySelectorAll('[role="tab"][data-state="active"]')).find((tab) => isRelevantTabTrigger(tab)) || null;
    const activePanel = getPanelForTabTrigger(activeTab);
    let tables = await extractAllTableData({ expandMetricTables: false, root: activePanel, requireVisibility: true });

    if (tables.length === 0 && activePanel) {
      tables = await extractAllTableData({ expandMetricTables: false, root: activePanel, requireVisibility: false });
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
  }, [extractAllTableData, isRelevantTabTrigger]);

  useEffect(() => {
    if (!isDialogOpen) return;
    void refreshVisibleTables();
  }, [isDialogOpen, refreshVisibleTables]);

  const toggleTabOption = (key: string) => {
    setSelectedTabs((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
    setAllTabsEnabled(false);
  };

  const shouldExportTab = useCallback(
    (trigger: Element | null) => {
      const option = findMatchingTabOption(trigger);
      if (!option) return false;
      return allTabsEnabled || Boolean(selectedTabs[option.key]);
    },
    [allTabsEnabled, findMatchingTabOption, selectedTabs]
  );

  const collectExportSections = useCallback(async () => {
    const sections: ExportSection[] = [];
    const seenTabs = new Set<string>();
    const originalActiveTab = (Array.from(document.querySelectorAll('[role="tab"][data-state="active"]')).find((tab) => isRelevantTabTrigger(tab)) || null) as HTMLElement | null;
    const { tabValue: activeTabValue, tabText: activeTabText } = getCurrentTabInfo();
    const selectedCurrentTableIds = new Set(selectedVisibleTableIds);

    if (currentViewEnabled) {
      const currentPanel = getPanelForTabTrigger(originalActiveTab);
      let tables = await extractAllTableData({
        allowedIds: selectedCurrentTableIds.size > 0 ? selectedCurrentTableIds : undefined,
        expandMetricTables: true,
        root: currentPanel,
        requireVisibility: true,
      });

      if (tables.length === 0) {
        tables = await extractAllTableData({
          allowedIds: selectedCurrentTableIds.size > 0 ? selectedCurrentTableIds : undefined,
          expandMetricTables: true,
          root: currentPanel,
          requireVisibility: false,
        });
      }

      if (tables.length > 0) {
        sections.push({
          key: 'current-view',
          heading: `Current View – ${activeTabText}`,
          tabValue: activeTabValue,
          tabLabel: activeTabText,
          tables,
        });
        seenTabs.add(activeTabValue);
      }
    }

    const tabTriggers = Array.from(document.querySelectorAll('[role="tab"]')).filter((trigger) => isRelevantTabTrigger(trigger)) as HTMLElement[];
    for (const trigger of tabTriggers) {
      const tabValue = getTabTriggerValue(trigger);
      const option = findMatchingTabOption(trigger);
      const tabLabel = option?.label || getTabTriggerLabel(trigger);
      if (seenTabs.has(tabValue)) continue;
      if (!shouldExportTab(trigger)) continue;

      trigger.click();
      await waitForUiSettling();

      const triggerPanel = getPanelForTabTrigger(trigger);
      let tables = await extractAllTableData({ expandMetricTables: true, root: triggerPanel, requireVisibility: true });
      if (tables.length === 0) {
        tables = await extractAllTableData({ expandMetricTables: true, root: triggerPanel, requireVisibility: false });
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
      await waitForUiSettling(300);
      await refreshVisibleTables();
    }

    return sections;
  }, [currentViewEnabled, extractAllTableData, findMatchingTabOption, getCurrentTabInfo, isRelevantTabTrigger, refreshVisibleTables, selectedVisibleTableIds, shouldExportTab]);

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
        bundle.contextLabel ? `Context: ${bundle.contextLabel}` : undefined,
        `Sections: ${bundle.sections.length}`,
      ].filter(Boolean).join('\n')
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
      ['Context', bundle.contextLabel || 'Current workspace view'],
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
    if (currentViewEnabled && visibleTables.length > 0 && selectedVisibleTableIds.length === 0) {
      toast({
        title: 'No tables selected',
        description: 'Pick at least one visible table from the current tab, or disable current-view export.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      setIsDialogOpen(false);
      await waitForUiSettling(120);

      const sections = await collectExportSections();
      if (sections.length === 0) {
        toast({
          title: 'No displayed tables found',
          description: 'There were no rendered table rows to export for the chosen scope.',
          variant: 'destructive',
        });
        return;
      }

      const safeBaseFileName = sanitizeFileSegment(fileName || defaultFileName || `${analyticsName}-displayed-tables`);
      const suffix = contextLabel ? sanitizeFileSegment(contextLabel).toLowerCase() : 'current-view';
      const fullFileName = `${safeBaseFileName}-${suffix}-${format(new Date(), 'yyyyMMdd-HHmm')}`;

      const bundle: ExportBundle = {
        title: `${analyticsName} Display Export`,
        generatedAt: new Date().toISOString(),
        contextLabel,
        sections,
      };

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
        title: `${analyticsName} export ready`,
        description: `${FORMAT_LABELS[exportFormat]} created from displayed table output.`,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Something went sideways while exporting the displayed tables.',
        variant: 'destructive',
      });
      setIsDialogOpen(true);
    } finally {
      setIsExporting(false);
    }
  }, [analyticsName, collectExportSections, contextLabel, currentViewEnabled, defaultFileName, exportCsvBundle, exportFormat, exportJsonBundle, exportPdfBundle, exportTextBundle, exportWorkbookBundle, fileName, selectedVisibleTableIds.length, toast, visibleTables.length]);

  const selectedScopeCount = Number(currentViewEnabled) + Number(allTabsEnabled) + Object.values(selectedTabs).filter(Boolean).length;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {renderTrigger !== false && (
        <DialogTrigger asChild>
          <Button variant={buttonVariant} size={buttonSize} className={cn('gap-2', buttonClassName)}>
            <Download className="h-4 w-4" />
            {buttonLabel ?? `Export ${analyticsName} Tables`}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            Better {analyticsName} Export
          </DialogTitle>
          <DialogDescription>
            {dialogDescription ?? `Export the rendered ${analyticsName.toLowerCase()} tables exactly as they appear in the selected tab scope — no raw-row spaghetti, just what’s on screen.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${sanitizeFileSegment(analyticsName).toLowerCase()}-export-format`}>Format</Label>
              <select
                id={`${sanitizeFileSegment(analyticsName).toLowerCase()}-export-format`}
                value={exportFormat}
                onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="xlsx">Excel workbook (.xlsx)</option>
                <option value="csv">CSV bundle (.csv/.zip)</option>
                <option value="txt">Text report (.txt)</option>
                <option value="json">JSON bundle (.json)</option>
                <option value="pdf">Print-ready PDF</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${sanitizeFileSegment(analyticsName).toLowerCase()}-file-name`}>File name prefix</Label>
              <Input
                id={`${sanitizeFileSegment(analyticsName).toLowerCase()}-file-name`}
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                placeholder={`${sanitizeFileSegment(analyticsName).toLowerCase()}-displayed-tables`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Tab scope</Label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                <Checkbox checked={currentViewEnabled} onCheckedChange={() => setCurrentViewEnabled((previous) => !previous)} />
                <span className="text-sm text-slate-800">Current active tab</span>
              </label>

              {tabOptions.map((option) => (
                <label key={option.key} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                  <Checkbox checked={allTabsEnabled ? true : Boolean(selectedTabs[option.key])} onCheckedChange={() => toggleTabOption(option.key)} />
                  <span className="text-sm text-slate-800">{option.label}</span>
                </label>
              ))}

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 md:col-span-2">
                <Checkbox checked={allTabsEnabled} onCheckedChange={() => setAllTabsEnabled((previous) => !previous)} />
                <span className="text-sm text-slate-800">All mapped tabs</span>
              </label>
            </div>
          </div>

          {currentViewEnabled && (
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
              <li>Scope selected: <span className="font-medium">{selectedScopeCount}</span></li>
              <li>Current-view tables selected: <span className="font-medium">{selectedVisibleTableIds.length || visibleTables.length || 0}</span></li>
              <li>Context: <span className="font-medium">{contextLabel || 'Current workspace view'}</span></li>
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