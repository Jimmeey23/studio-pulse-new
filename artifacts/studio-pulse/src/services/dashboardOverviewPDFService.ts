import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { overviewModules, overviewModulesById } from '@/components/dashboard/overview/registry';
import { buildOverviewModuleContent } from '@/components/dashboard/overview/moduleBuilders';
import {
  asOverviewCharts,
  asOverviewTables,
  getDataLabAssetsForModule,
  type DataLabDashboardCard,
} from '@/services/dataLabDashboardBridge';
import {
  filterByOverviewFilters,
  formatOverviewValue,
  getOverviewLocationLabelById,
  normalizeLocationId,
  OVERVIEW_REPORT_LOCATION_IDS,
  type OverviewLocationId,
} from '@/components/dashboard/overview/filtering';
import type {
  OverviewAccent,
  OverviewChartDefinition,
  OverviewDataBundle,
  OverviewFiltersShape,
  OverviewModuleContent,
  OverviewModuleId,
  OverviewRankingDefinition,
  OverviewTableDefinition,
} from '@/components/dashboard/overview/types';
import { getSummaryText, type SummaryContext, type SummaryLocationId } from '@/services/infoSummaryService';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: unknown) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface OverviewReportSection {
  moduleId: OverviewModuleId;
  moduleContent: OverviewModuleContent;
  summaries: string[];
  customCards: DataLabDashboardCard[];
  customCharts: OverviewChartDefinition[];
  customTables: OverviewTableDefinition[];
}

interface DashboardOverviewExportOptions {
  data: OverviewDataBundle;
  filters: OverviewFiltersShape;
  selectedLocations?: string[];
}

type AccentPalette = {
  primary: [number, number, number];
  soft: [number, number, number];
  border: [number, number, number];
};

type PdfMetricCardItem = {
  title: string;
  value: string;
  description: string;
};

const MODULE_POPOVER_CONTEXT: Record<OverviewModuleId, string> = {
  'sales-analytics': 'sales-overview',
  'funnel-leads': 'funnel-leads-overview',
  'client-retention': 'client-retention-overview',
  'trainer-performance': 'trainer-performance-overview',
  'class-attendance': 'class-attendance-overview',
  'discounts-promotions': 'discounts-promotions-overview',
  'class-formats': 'class-formats-overview',
  'late-cancellations': 'late-cancellations-overview',
  'patterns-trends': 'patterns-trends-overview',
  'expiration-analytics': 'expiration-analytics-overview',
};

const MODULE_SUMMARY_CONTEXT: Record<OverviewModuleId, SummaryContext> = {
  'sales-analytics': 'sales-overview',
  'funnel-leads': 'leads-overview',
  'client-retention': 'clients-overview',
  'trainer-performance': 'trainer-overview',
  'class-attendance': 'sessions-overview',
  'discounts-promotions': 'discounts-overview',
  'class-formats': 'sessions-overview',
  'late-cancellations': 'late-cancellations-overview',
  'patterns-trends': 'sessions-overview',
  'expiration-analytics': 'expiration-analytics-overview',
};

const ACCENT_PALETTES: Record<OverviewAccent, AccentPalette> = {
  emerald: { primary: [16, 185, 129], soft: [236, 253, 245], border: [110, 231, 183] },
  blue: { primary: [37, 99, 235], soft: [239, 246, 255], border: [147, 197, 253] },
  purple: { primary: [147, 51, 234], soft: [250, 245, 255], border: [196, 181, 253] },
  rose: { primary: [225, 29, 72], soft: [255, 241, 242], border: [253, 164, 175] },
  amber: { primary: [217, 119, 6], soft: [255, 251, 235], border: [253, 230, 138] },
  teal: { primary: [13, 148, 136], soft: [240, 253, 250], border: [94, 234, 212] },
  indigo: { primary: [79, 70, 229], soft: [238, 242, 255], border: [165, 180, 252] },
  slate: { primary: [51, 65, 85], soft: [248, 250, 252], border: [203, 213, 225] },
};

const PAGE_MARGIN = 14;
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - PAGE_MARGIN * 2;

const buildReportFilters = (filters: OverviewFiltersShape, locationId: OverviewLocationId): OverviewFiltersShape => ({
  dateRange: filters.dateRange,
  location: locationId === 'all' ? [] : [getOverviewLocationLabelById(locationId as Exclude<OverviewLocationId, 'all'>)],
});

const filterBundleForReport = (data: OverviewDataBundle, filters: OverviewFiltersShape): OverviewDataBundle => ({
  sales: filterByOverviewFilters(data.sales, filters, {
    getDate: (item) => item.paymentDate,
    getLocation: (item) => item.calculatedLocation,
  }),
  leads: filterByOverviewFilters(data.leads, filters, {
    getDate: (item) => item.createdAt || item.period,
    getLocation: (item) => item.center,
  }),
  newClients: filterByOverviewFilters(data.newClients, filters, {
    getDate: (item) => item.firstVisitDate || item.monthYear,
    getLocation: (item) => item.homeLocation || item.firstVisitLocation,
  }),
  payroll: filterByOverviewFilters(data.payroll, filters, {
    getDate: (item) => item.monthYear,
    getLocation: (item) => item.location,
  }),
  sessions: filterByOverviewFilters(data.sessions, filters, {
    getDate: (item) => item.date,
    getLocation: (item) => item.location,
  }),
  lateCancellations: filterByOverviewFilters(data.lateCancellations, filters, {
    getDate: (item) => item.dateIST,
    getLocation: (item) => item.location,
  }),
  expirations: filterByOverviewFilters(data.expirations, filters, {
    getDate: (item) => item.endDate || item.orderAt,
    getLocation: (item) => item.homeLocation,
  }),
  checkins: filterByOverviewFilters(data.checkins, filters, {
    getDate: (item) => item.dateIST,
    getLocation: (item) => item.location,
  }),
  filters,
});

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const BRAND_LOGO_PATH = '/physique57-logo.png';
const COVER_IMAGE_PATH = '/images/013-10210-Physique-57-by-Atelier-Birjis-5.png';
const EXTERNAL_BRAND_IMAGE_URLS = [
  'https://i.postimg.cc/8k9M7m5c/IMG-6314.png',
  'https://i.postimg.cc/nVgBXGzz/IMG-6315.png',
  'https://i.postimg.cc/v8kf4tBZ/IMG-6316.png',
  'https://i.postimg.cc/tRwWsNTC/IMG-6317.png',
  'https://i.postimg.cc/8k9M7m5T/IMG-6318.png',
  'https://i.postimg.cc/VspnJW61/IMG-6319.png',
  'https://i.postimg.cc/7Pd05n6x/IMG-6320.png',
  'https://i.postimg.cc/G3VG4x2d/IMG-6321.png',
  'https://i.postimg.cc/XNmdrkJS/IMG-6322.png',
  'https://i.postimg.cc/wxZL1QBC/IMG-6324.png',
  'https://i.postimg.cc/tJKx8pfv/IMG-6326.png',
  'https://i.postimg.cc/1R2w8rtx/IMG-6327.png',
  'https://i.postimg.cc/0jTwhP3J/IMG-6329.png',
  'https://i.postimg.cc/gjCZ1m5R/IMG-6330.png',
  'https://i.postimg.cc/9067sCSw/IMG-6331.png',
  'https://i.postimg.cc/yxMZ2s5R/IMG-6332.png',
  'https://i.postimg.cc/GmXDv4nW/IMG-6336.png',
  'https://i.postimg.cc/x16mLXVB/IMG-6337.png',
  'https://i.postimg.cc/zGxhTyYM/IMG-6338.png',
  'https://i.postimg.cc/HkY5JQRz/IMG-6339.png',
  'https://i.postimg.cc/13vFD816/IMG-6340.png',
  'https://i.postimg.cc/6pWR7dgz/IMG-6341.png',
  'https://i.postimg.cc/NjsTy1Sp/IMG-6342.png',
];

const collapseSpacedRuns = (value: string) =>
  value
    .replace(/\b(?:[A-Za-z]\s+){3,}[A-Za-z]\b/g, (match) => match.replace(/\s+/g, ''))
    .replace(/(\d)\s+(?=\d)/g, '$1');

const toPdfSafeText = (value: unknown) =>
  collapseSpacedRuns(
    String(value ?? '')
      .replace(/\u00a0/g, ' ')
      .replace(/₹/g, 'INR ')
      .replace(/[•·]/g, '-')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );

const splitPdfSafeText = (pdf: jsPDF, value: unknown, width: number) => pdf.splitTextToSize(toPdfSafeText(value), width);

const loadImageAsDataUrl = async (src: string): Promise<string | null> => {
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(image, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (error) {
    console.warn(`Unable to load image asset: ${src}`, error);
    return null;
  }
};

const loadBrandImagePool = async (limit = 8): Promise<string[]> => {
  const uniqueUrls = Array.from(new Set(EXTERNAL_BRAND_IMAGE_URLS)).slice(0, limit);
  const loaded = await Promise.all(uniqueUrls.map((url) => loadImageAsDataUrl(url)));
  return loaded.filter((item): item is string => Boolean(item));
};

const estimateNarrativeBlockHeight = (pdf: jsPDF, summaries: string[]) => {
  const summaryText = toPdfSafeText(summaries.join(' '));
  const summaryLines = pdf.splitTextToSize(summaryText, CONTENT_WIDTH_MM - 10);
  return Math.max(18, summaryLines.length * 3.5 + 10) + 4;
};

const estimateMetricGridHeight = (cardsCount: number) => {
  if (!cardsCount) return 0;
  const cardsPerRow = 4;
  const gap = 4;
  const boxHeight = 22;
  return Math.ceil(cardsCount / cardsPerRow) * (boxHeight + gap);
};

const normaliseSummaryText = (value: string) =>
  toPdfSafeText(value)
    .replace(/^[\s\-:]+/, '')
    .trim();

const dedupeTexts = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normaliseSummaryText(item).toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const extractPopoverSummaryBlocks = (html: string): string[] => {
  if (!html) return [];

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(html, 'text/html');
  const texts: string[] = [];

  documentNode.querySelectorAll('.note, .executive-summary p, .section p, .insight-card p').forEach((element) => {
    const text = normaliseSummaryText(element.textContent || '');
    if (text.length >= 30) {
      texts.push(text);
    }
  });

  documentNode.querySelectorAll('.info-card').forEach((card) => {
    const heading = normaliseSummaryText(card.querySelector('h2')?.textContent || '');
    const metricLines = Array.from(card.querySelectorAll('.metric'))
      .map((metric) => {
        const spans = Array.from(metric.querySelectorAll('span')).map((span) => normaliseSummaryText(span.textContent || ''));
        if (spans.length >= 2 && spans[0] && spans[1]) {
          return `${spans[0]} ${spans[1]}`;
        }
        return normaliseSummaryText(metric.textContent || '');
      })
      .filter((line) => line.length >= 8)
      .slice(0, 3);

    if (metricLines.length) {
      texts.push([heading, metricLines.join('; ')].filter(Boolean).join(': '));
    }
  });

  if (!texts.length) {
    const bodyText = normaliseSummaryText(documentNode.body?.textContent || '');
    if (bodyText) {
      const sentences = bodyText
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => normaliseSummaryText(sentence))
        .filter((sentence) => sentence.length >= 30);
      texts.push(...sentences);
    }
  }

  return dedupeTexts(texts)
    .map((text) => normaliseSummaryText(text))
    .filter((text) => text.length >= 24)
    .slice(0, 4);
};

const toSummaryLocationId = (locationId: OverviewLocationId): SummaryLocationId => {
  if (locationId === 'kwality' || locationId === 'supreme' || locationId === 'kenkere') {
    return locationId;
  }
  return 'all';
};

const loadModuleSummaries = async (moduleId: OverviewModuleId, locationId: OverviewLocationId): Promise<string[]> => {
  const popoverContext = MODULE_POPOVER_CONTEXT[moduleId];
  const fallbackSummary = normaliseSummaryText(getSummaryText(MODULE_SUMMARY_CONTEXT[moduleId], toSummaryLocationId(locationId)));

  if (!popoverContext) {
    return fallbackSummary ? [fallbackSummary] : [];
  }

  try {
    const response = await fetch(`/popovers/${popoverContext}/${encodeURIComponent(locationId)}.html`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallbackSummary ? [fallbackSummary] : [];
    }

    const html = await response.text();
    const blocks = extractPopoverSummaryBlocks(html);
    if (blocks.length) {
      return blocks;
    }
  } catch (error) {
    console.warn(`Failed to load popover summary for ${moduleId}/${locationId}`, error);
  }

  return fallbackSummary ? [fallbackSummary] : [];
};

const formatPeriodLabel = (dateRange: OverviewFiltersShape['dateRange']) => {
  const { start, end } = dateRange;
  if (!start && !end) {
    return 'All Time';
  }

  const parse = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const startDate = start ? parse(start) : null;
  const endDate = end ? parse(end) : null;

  if (startDate && endDate) {
    const sameMonth =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth();
    const isWholeMonth =
      startDate.getDate() === 1 &&
      new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate() === endDate.getDate();

    if (sameMonth && isWholeMonth) {
      return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  if (startDate) {
    return `From ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return `Until ${endDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const buildExecutiveSummary = (locationName: string, periodLabel: string, sections: OverviewReportSection[]) => {
  const summarySeeds = sections
    .flatMap((section) => section.summaries)
    .map((summary) => normaliseSummaryText(summary))
    .filter(Boolean)
    .slice(0, 3);

  if (summarySeeds.length) {
    return toPdfSafeText(
      `This performance report consolidates the dashboard overview for ${locationName} during ${periodLabel}. ${summarySeeds.join(' ')}`
    );
  }

  return toPdfSafeText(
    `This performance report consolidates the dashboard overview for ${locationName} during ${periodLabel}, combining revenue, lead generation, retention, class utilisation, trainer performance, and churn analytics into one professional reference document.`
  );
};

const buildRecommendations = (sections: OverviewReportSection[]) =>
  sections
    .flatMap((section) =>
      section.summaries.slice(0, 1).map((summary) => toPdfSafeText(`${overviewModulesById[section.moduleId].label}: ${summary}`))
    )
    .slice(0, 6);

const drawMetricGrid = (pdf: jsPDF, startY: number, cards: PdfMetricCardItem[], palette: AccentPalette) => {
  const cardsPerRow = 4;
  const gap = 4;
  const boxWidth = (CONTENT_WIDTH_MM - gap * (cardsPerRow - 1)) / cardsPerRow;
  const boxHeight = 24;

  cards.forEach((card, index) => {
    const column = index % cardsPerRow;
    const row = Math.floor(index / cardsPerRow);
    const x = PAGE_MARGIN + column * (boxWidth + gap);
    const y = startY + row * (boxHeight + gap);

    pdf.setFillColor(palette.soft[0], palette.soft[1], palette.soft[2]);
    pdf.roundedRect(x, y, boxWidth, boxHeight, 2.2, 2.2, 'F');
    pdf.setDrawColor(palette.border[0], palette.border[1], palette.border[2]);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, boxWidth, boxHeight, 2.2, 2.2, 'S');

    pdf.setFontSize(6.8);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.text(toPdfSafeText(card.title).toUpperCase(), x + 2.5, y + 5.5);

    pdf.setFontSize(10.6);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.text(splitPdfSafeText(pdf, card.value, boxWidth - 5).slice(0, 1), x + 2.5, y + 12.2);

    pdf.setFontSize(6.6);
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    const descriptionLines = splitPdfSafeText(pdf, card.description, boxWidth - 5);
    pdf.text(descriptionLines.slice(0, 3), x + 2.5, y + 16.8);
  });

  return startY + Math.ceil(cards.length / cardsPerRow) * (boxHeight + gap);
};

const drawRankingColumn = (
  pdf: jsPDF,
  ranking: OverviewRankingDefinition,
  x: number,
  y: number,
  width: number,
  palette: AccentPalette
) => {
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, width, 44, 2.5, 2.5, 'F');
  pdf.setDrawColor(palette.border[0], palette.border[1], palette.border[2]);
  pdf.roundedRect(x, y, width, 44, 2.5, 2.5, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(toPdfSafeText(ranking.title), x + 3, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  const descriptionLines = splitPdfSafeText(pdf, ranking.description, width - 6);
  pdf.text(descriptionLines.slice(0, 2), x + 3, y + 10.5);

  const entries = ranking.entries.slice(0, 5);
  entries.forEach((entry, index) => {
    const rowY = y + 16 + index * 5.2;
    pdf.setFillColor(palette.soft[0], palette.soft[1], palette.soft[2]);
    pdf.roundedRect(x + 2.5, rowY - 2.8, width - 5, 4.2, 1.2, 1.2, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.8);
    pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
    pdf.text(String(index + 1), x + 4.5, rowY);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    const safeEntryLabel = toPdfSafeText(entry.label);
    const label = safeEntryLabel.length > 22 ? `${safeEntryLabel.slice(0, 21)}...` : safeEntryLabel;
    pdf.text(label, x + 10, rowY);

    pdf.setFont('helvetica', 'bold');
    pdf.text(toPdfSafeText(formatOverviewValue(entry.value, ranking.format)), x + width - 4, rowY, { align: 'right' });
  });
};

const drawChartPanel = (
  pdf: jsPDF,
  chart: OverviewChartDefinition,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: AccentPalette
) => {
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, width, height, 2.5, 2.5, 'F');
  pdf.setDrawColor(palette.border[0], palette.border[1], palette.border[2]);
  pdf.roundedRect(x, y, width, height, 2.5, 2.5, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text(toPdfSafeText(chart.title), x + 3, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.4);
  pdf.setTextColor(100, 116, 139);
  const descriptionLines = splitPdfSafeText(pdf, chart.description, width - 6);
  pdf.text(descriptionLines.slice(0, 2), x + 3, y + 10.5);

  if (!chart.data.length) {
    pdf.setFontSize(7);
    pdf.text(toPdfSafeText(chart.emptyMessage || 'No chart data available.'), x + 3, y + 20);
    return;
  }

  const rows = chart.data.slice(0, 4);
  const numericValues = rows.flatMap((row) =>
    chart.series.map((series) => Number(row[series.key] || 0))
  );
  const maxValue = Math.max(1, ...numericValues);
  const plotStartY = y + 18;
  const labelWidth = width * 0.27;
  const barAreaWidth = width - labelWidth - 8;
  const rowGap = 8;

  rows.forEach((row, rowIndex) => {
    const rowY = plotStartY + rowIndex * rowGap;
    const rawLabel = toPdfSafeText(row[chart.xKey] || 'Unknown');
    const label = rawLabel.length > 14 ? `${rawLabel.slice(0, 13)}...` : rawLabel;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.3);
    pdf.setTextColor(51, 65, 85);
    pdf.text(label, x + 3, rowY + 1.6);

    chart.series.slice(0, 2).forEach((series, seriesIndex) => {
      const value = Number(row[series.key] || 0);
      const barY = rowY + seriesIndex * 2.6;
      const barWidth = Math.max(0.8, (value / maxValue) * barAreaWidth);
      const barX = x + labelWidth;
      const color = series.color.match(/[a-f0-9]{2}/gi)
        ? [
            Number.parseInt(series.color.slice(1, 3), 16),
            Number.parseInt(series.color.slice(3, 5), 16),
            Number.parseInt(series.color.slice(5, 7), 16),
          ]
        : palette.primary;

      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.roundedRect(barX, barY, barWidth, 1.8, 0.8, 0.8, 'F');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.8);
      pdf.setTextColor(71, 85, 105);
      pdf.text(toPdfSafeText(formatOverviewValue(value, chart.format)), x + width - 3, barY + 1.5, { align: 'right' });
    });
  });
};

const drawChartsRow = (pdf: jsPDF, startY: number, moduleContent: OverviewModuleContent, palette: AccentPalette) => {
  const gap = 5;
  const chartWidth = (CONTENT_WIDTH_MM - gap) / 2;
  const chartHeight = 54;

  drawChartPanel(pdf, moduleContent.charts[0], PAGE_MARGIN, startY, chartWidth, chartHeight, palette);
  drawChartPanel(pdf, moduleContent.charts[1], PAGE_MARGIN + chartWidth + gap, startY, chartWidth, chartHeight, palette);

  return startY + chartHeight + 4;
};

const drawNarrativeBlock = (pdf: jsPDF, startY: number, summaries: string[], palette: AccentPalette) => {
  const summaryText = toPdfSafeText(summaries.join(' '));
  const summaryLines = pdf.splitTextToSize(summaryText, CONTENT_WIDTH_MM - 10);
  const blockHeight = Math.max(18, summaryLines.length * 3.5 + 10);

  pdf.setFillColor(palette.soft[0], palette.soft[1], palette.soft[2]);
  pdf.roundedRect(PAGE_MARGIN, startY, CONTENT_WIDTH_MM, blockHeight, 2.5, 2.5, 'F');
  pdf.setDrawColor(palette.border[0], palette.border[1], palette.border[2]);
  pdf.roundedRect(PAGE_MARGIN, startY, CONTENT_WIDTH_MM, blockHeight, 2.5, 2.5, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
  pdf.text('Narrative Summary', PAGE_MARGIN + 4, startY + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.2);
  pdf.setTextColor(51, 65, 85);
  pdf.text(summaryLines, PAGE_MARGIN + 4, startY + 11);

  return startY + blockHeight + 4;
};

const drawSectionHeader = (pdf: jsPDF, startY: number, title: string, subtitle: string, palette: AccentPalette) => {
  pdf.setFillColor(palette.primary[0], palette.primary[1], palette.primary[2]);
  pdf.roundedRect(PAGE_MARGIN, startY, CONTENT_WIDTH_MM, 18, 3, 3, 'F');
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(PAGE_MARGIN + 2, startY + 13.2, CONTENT_WIDTH_MM - 4, 0.6, 0.2, 0.2, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(255, 255, 255);
  pdf.text(toPdfSafeText(title), PAGE_MARGIN + 4, startY + 7);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(splitPdfSafeText(pdf, subtitle, CONTENT_WIDTH_MM - 8).slice(0, 2), PAGE_MARGIN + 4, startY + 12);

  return startY + 22;
};

const drawTableBlock = (
  pdf: jsPDF,
  startY: number,
  table: OverviewTableDefinition,
  palette: AccentPalette
) => {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(toPdfSafeText(table.title), PAGE_MARGIN, startY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.3);
  pdf.setTextColor(100, 116, 139);
  pdf.text(splitPdfSafeText(pdf, table.description, CONTENT_WIDTH_MM).slice(0, 2), PAGE_MARGIN, startY + 3.8);

  autoTable(pdf, {
    startY: startY + 6,
    head: [table.columns.map((column) => column.label)],
    body: table.rows.length
      ? table.rows.map((row) =>
          table.columns.map((column) => toPdfSafeText(formatOverviewValue(row[column.key] ?? '', column.format)))
        )
      : [
          [
            toPdfSafeText(table.emptyMessage || 'No table data available for the active filters.'),
            ...table.columns.slice(1).map(() => ''),
          ],
        ],
    theme: 'grid',
    headStyles: {
      fillColor: palette.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left',
      valign: 'middle',
      cellPadding: { top: 1.6, right: 1.4, bottom: 1.6, left: 1.4 },
    },
    bodyStyles: {
      fontSize: 6.4,
      textColor: [30, 41, 59],
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      cellPadding: { top: 1.6, right: 1.4, bottom: 1.6, left: 1.4 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    tableLineColor: [203, 213, 225],
    tableLineWidth: 0.18,
    styles: {
      overflow: 'linebreak',
      valign: 'middle',
    },
    columnStyles: table.columns.reduce((acc, column, index) => {
      const isFirst = index === 0;
      acc[index] = {
        cellWidth: isFirst ? CONTENT_WIDTH_MM * 0.34 : 'auto',
        halign: column.align === 'center' ? 'center' : column.align === 'right' ? 'right' : 'left',
      };
      return acc;
    }, {} as Record<number, { cellWidth: number | 'auto'; halign: 'left' | 'center' | 'right' }>),
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    tableWidth: CONTENT_WIDTH_MM,
  });

  return (pdf.lastAutoTable?.finalY || startY + 24) + 5;
};

const fillRemainingSpaceWithBrandVisual = (
  pdf: jsPDF,
  startY: number,
  imageData: string | null,
  title: string
) => {
  if (!imageData) return;
  const availableHeight = PAGE_HEIGHT_MM - 24 - startY;
  if (availableHeight < 28) return;

  const blockHeight = Math.min(availableHeight, 52);
  pdf.setFillColor(245, 247, 250);
  pdf.roundedRect(PAGE_MARGIN, startY, CONTENT_WIDTH_MM, blockHeight, 2.5, 2.5, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(PAGE_MARGIN, startY, CONTENT_WIDTH_MM, blockHeight, 2.5, 2.5, 'S');

  const imageWidth = Math.min(56, CONTENT_WIDTH_MM * 0.34);
  const imageHeight = blockHeight - 8;
  pdf.addImage(imageData, 'JPEG', PAGE_MARGIN + 4, startY + 4, imageWidth, imageHeight, undefined, 'FAST');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.8);
  pdf.setTextColor(30, 41, 59);
  pdf.text('Brand Spotlight', PAGE_MARGIN + imageWidth + 8, startY + 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.1);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    splitPdfSafeText(
      pdf,
      `${title} section generated from the dashboard canvas with aligned A4 spacing, wrapped text blocks, and balanced content hierarchy.`,
      CONTENT_WIDTH_MM - imageWidth - 14
    ),
    PAGE_MARGIN + imageWidth + 8,
    startY + 16
  );
};

const decoratePages = (pdf: jsPDF, locationName: string, periodLabel: string) => {
  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);

    if (page > 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(8.5, 8.5, PAGE_WIDTH_MM - 17, 7, 'F');
    }
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.5);
    pdf.rect(6, 6, PAGE_WIDTH_MM - 12, PAGE_HEIGHT_MM - 12);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
    pdf.rect(8.5, 8.5, PAGE_WIDTH_MM - 17, PAGE_HEIGHT_MM - 17);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    if (page > 1) {
      pdf.text('Physique 57 India - Dashboard Overview', PAGE_MARGIN, 13.3);
    }
    pdf.text(toPdfSafeText(locationName), PAGE_MARGIN, PAGE_HEIGHT_MM - 8);
    pdf.text(toPdfSafeText(periodLabel), PAGE_WIDTH_MM / 2, PAGE_HEIGHT_MM - 8, { align: 'center' });
    pdf.text(`Page ${page} of ${totalPages}`, PAGE_WIDTH_MM - PAGE_MARGIN, PAGE_HEIGHT_MM - 8, { align: 'right' });
  }
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const ensurePageSpace = (pdf: jsPDF, y: number, requiredHeight: number) => {
  if (y + requiredHeight <= PAGE_HEIGHT_MM - 24) {
    return y;
  }
  pdf.addPage();
  return 18;
};

const buildSectionPages = async (
  pdf: jsPDF,
  locationId: OverviewLocationId,
  locationName: string,
  periodLabel: string,
  data: OverviewDataBundle
) => {
  const [logoImageData, localCoverImageData, externalBrandImages] = await Promise.all([
    loadImageAsDataUrl(BRAND_LOGO_PATH),
    loadImageAsDataUrl(COVER_IMAGE_PATH),
    loadBrandImagePool(10),
  ]);
  const brandImagePool = externalBrandImages.length ? externalBrandImages : localCoverImageData ? [localCoverImageData] : [];
  const coverImageData = brandImagePool[0] || localCoverImageData;
  const sections: OverviewReportSection[] = [];

  for (const module of overviewModules) {
    const summaries = await loadModuleSummaries(module.id, locationId);
    const customAssets = getDataLabAssetsForModule(module.id);
    sections.push({
      moduleId: module.id,
      moduleContent: buildOverviewModuleContent(module.id, data),
      summaries,
      customCards: customAssets.cards,
      customCharts: asOverviewCharts(customAssets.charts),
      customTables: asOverviewTables(customAssets.tables),
    });
  }

  const executiveSummary = buildExecutiveSummary(locationName, periodLabel, sections);

  pdf.setFillColor(9, 18, 37);
  pdf.rect(0, 0, PAGE_WIDTH_MM, 86, 'F');
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 86, PAGE_WIDTH_MM, 8, 'F');

  if (coverImageData) {
    pdf.addImage(coverImageData, 'JPEG', PAGE_WIDTH_MM - 86, 8, 74, 56, undefined, 'FAST');
  }
  if (logoImageData) {
    pdf.addImage(logoImageData, 'JPEG', PAGE_MARGIN, 10, 35, 17, undefined, 'FAST');
  }

  const coverTitle = toPdfSafeText(`PERFORMANCE REPORT - ${locationName} - ${periodLabel}`);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text(splitPdfSafeText(pdf, coverTitle, CONTENT_WIDTH_MM - 84), PAGE_MARGIN, 38);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.2);
  pdf.setTextColor(191, 219, 254);
  pdf.text(toPdfSafeText('Dashboard Overview Consolidated Report'), PAGE_MARGIN, 52);
  pdf.text(toPdfSafeText(`Prepared on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`), PAGE_MARGIN, 58);

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(PAGE_MARGIN, 66, 58, 13, 2, 2, 'F');
  pdf.setDrawColor(148, 163, 184);
  pdf.roundedRect(PAGE_MARGIN, 66, 58, 13, 2, 2, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.8);
  pdf.setTextColor(30, 41, 59);
  pdf.text('LOCATION', PAGE_MARGIN + 3, 71.4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.2);
  pdf.text(toPdfSafeText(locationName), PAGE_MARGIN + 3, 76.4);

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(PAGE_MARGIN + 62, 66, 48, 13, 2, 2, 'F');
  pdf.roundedRect(PAGE_MARGIN + 62, 66, 48, 13, 2, 2, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.8);
  pdf.text('PERIOD', PAGE_MARGIN + 65, 71.4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.2);
  pdf.text(toPdfSafeText(periodLabel), PAGE_MARGIN + 65, 76.4);

  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(PAGE_MARGIN, 100, CONTENT_WIDTH_MM, 50, 3, 3, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(PAGE_MARGIN, 100, CONTENT_WIDTH_MM, 50, 3, 3, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Executive Overview', PAGE_MARGIN + 4, 108);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);
  pdf.text(splitPdfSafeText(pdf, executiveSummary, CONTENT_WIDTH_MM - 8), PAGE_MARGIN + 4, 115);

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(PAGE_MARGIN, 156, CONTENT_WIDTH_MM, 122, 3, 3, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(PAGE_MARGIN, 156, CONTENT_WIDTH_MM, 122, 3, 3, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Included Analytics Sections', PAGE_MARGIN + 4, 164);

  const columnWidth = (CONTENT_WIDTH_MM - 10) / 2;
  overviewModules.forEach((module, index) => {
    const row = index % 5;
    const column = Math.floor(index / 5);
    const baseX = PAGE_MARGIN + 4 + column * (columnWidth + 2);
    const baseY = 172 + row * 10.2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${index + 1}.`, baseX, baseY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(toPdfSafeText(module.label), baseX + 5, baseY);
  });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Report Methodology', PAGE_MARGIN + 4, 226.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.4);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    splitPdfSafeText(
      pdf,
      'All sections are generated from the same shared date and location filters. Module narratives are sourced from InfoPopover insights and normalized for print-safe export.',
      CONTENT_WIDTH_MM - 8
    ),
    PAGE_MARGIN + 4,
    232
  );

  if (brandImagePool[1]) {
    pdf.addImage(brandImagePool[1], 'JPEG', PAGE_MARGIN + CONTENT_WIDTH_MM - 62, 236, 58, 38, undefined, 'FAST');
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(PAGE_MARGIN + CONTENT_WIDTH_MM - 62, 236, 58, 38);
  }

  pdf.addPage();
  const tocPage = pdf.getNumberOfPages();
  const tocEntries: Array<{ title: string; page: number }> = [];

  const recommendations = buildRecommendations(sections);

  sections.forEach((section, sectionIndex) => {
    pdf.addPage();
    const customAssetCount = section.customCards.length + section.customCharts.length + section.customTables.length;
    const sectionImage = brandImagePool.length ? brandImagePool[(sectionIndex + 2) % brandImagePool.length] : coverImageData;
    tocEntries.push({
      title: `${overviewModulesById[section.moduleId].label}${customAssetCount ? ` (+${customAssetCount} custom)` : ''}`,
      page: pdf.getNumberOfPages(),
    });

    const palette = ACCENT_PALETTES[overviewModulesById[section.moduleId].accent];
    const sectionCards: PdfMetricCardItem[] = [
      ...section.moduleContent.cards.map((card) => ({
        title: card.title,
        value: card.value,
        description: card.description,
      })),
      ...section.customCards.map((card) => ({
        title: card.title,
        value: card.value,
        description: card.description,
      })),
    ];
    const sectionCharts = [...section.moduleContent.charts, ...section.customCharts];
    const sectionTables = [...section.moduleContent.tables, ...section.customTables];
    let y = 16;

    y = drawSectionHeader(pdf, y, section.moduleContent.title, section.moduleContent.subtitle, palette);
    const narrativeItems = section.summaries.length
      ? section.summaries
      : [`No saved InfoPopover insight was found for ${overviewModulesById[section.moduleId].label}.`];
    y = ensurePageSpace(pdf, y, estimateNarrativeBlockHeight(pdf, narrativeItems));
    y = drawNarrativeBlock(
      pdf,
      y,
      narrativeItems,
      palette
    );

    if (sectionImage) {
      y = ensurePageSpace(pdf, y, 34);
      pdf.setFillColor(250, 250, 250);
      pdf.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH_MM, 30, 2.4, 2.4, 'F');
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH_MM, 30, 2.4, 2.4, 'S');
      pdf.addImage(sectionImage, 'JPEG', PAGE_MARGIN + 2.5, y + 2.5, 44, 25, undefined, 'FAST');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text('Visual Context', PAGE_MARGIN + 50, y + 9);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.2);
      pdf.setTextColor(71, 85, 105);
      pdf.text(
        splitPdfSafeText(
          pdf,
          `This module blends KPI cards, chart trends, rankings, and tables into one structured A4 view for ${locationName}.`,
          CONTENT_WIDTH_MM - 54
        ),
        PAGE_MARGIN + 50,
        y + 14
      );
      y += 34;
    }

    y = ensurePageSpace(pdf, y, estimateMetricGridHeight(sectionCards.length));
    y = drawMetricGrid(pdf, y, sectionCards, palette);

    for (let index = 0; index < sectionCharts.length; index += 2) {
      y = ensurePageSpace(pdf, y, 60);
      const gap = 5;
      const chartWidth = (CONTENT_WIDTH_MM - gap) / 2;
      const chartHeight = 54;
      const leftChart = sectionCharts[index];
      const rightChart = sectionCharts[index + 1];

      drawChartPanel(pdf, leftChart, PAGE_MARGIN, y, chartWidth, chartHeight, palette);
      if (rightChart) {
        drawChartPanel(pdf, rightChart, PAGE_MARGIN + chartWidth + gap, y, chartWidth, chartHeight, palette);
      }
      y += chartHeight + 4;
    }

    y = ensurePageSpace(pdf, y, 54);
    drawRankingColumn(pdf, section.moduleContent.topRanking, PAGE_MARGIN, y, (CONTENT_WIDTH_MM - 5) / 2, palette);
    drawRankingColumn(
      pdf,
      section.moduleContent.bottomRanking,
      PAGE_MARGIN + (CONTENT_WIDTH_MM - 5) / 2 + 5,
      y,
      (CONTENT_WIDTH_MM - 5) / 2,
      palette
    );

    let tableY = y + 49;
    for (const table of sectionTables) {
      tableY = ensurePageSpace(pdf, tableY, 62);
      tableY = drawTableBlock(pdf, tableY, table, palette);
    }

    fillRemainingSpaceWithBrandVisual(pdf, tableY + 2, sectionImage, overviewModulesById[section.moduleId].label);
  });

  pdf.addPage();
  const recommendationsPage = pdf.getNumberOfPages();
  tocEntries.push({ title: 'Strategic Focus Areas', page: recommendationsPage });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Strategic Focus Areas', PAGE_MARGIN, 22);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(splitPdfSafeText(pdf, 'These priorities are compiled from the same InfoPopover insight sources shown in the live overview tabs.', CONTENT_WIDTH_MM), PAGE_MARGIN, 28);

  let recommendationY = 40;
  recommendations.forEach((recommendation, index) => {
    const lines = splitPdfSafeText(pdf, recommendation, CONTENT_WIDTH_MM - 12);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(PAGE_MARGIN, recommendationY - 5, CONTENT_WIDTH_MM, lines.length * 4 + 8, 2.5, 2.5, 'F');
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(PAGE_MARGIN, recommendationY - 5, CONTENT_WIDTH_MM, lines.length * 4 + 8, 2.5, 2.5, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${index + 1}.`, PAGE_MARGIN + 3, recommendationY + 1);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.4);
    pdf.setTextColor(51, 65, 85);
    pdf.text(lines, PAGE_MARGIN + 9, recommendationY + 1);

    recommendationY += lines.length * 4 + 12;
  });

  recommendationY = ensurePageSpace(pdf, recommendationY + 4, 34);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(PAGE_MARGIN, recommendationY - 4, CONTENT_WIDTH_MM, 30, 2.5, 2.5, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(PAGE_MARGIN, recommendationY - 4, CONTENT_WIDTH_MM, 30, 2.5, 2.5, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Operational Notes', PAGE_MARGIN + 4, recommendationY + 2);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.3);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    splitPdfSafeText(
      pdf,
      `Filter context: ${locationName}, ${periodLabel}. Sections preserve the core rankings and include both standard overview content and any Custom Data Lab assets added to module cards, charts, or tables.`,
      CONTENT_WIDTH_MM - 8
    ),
    PAGE_MARGIN + 4,
    recommendationY + 8
  );
  fillRemainingSpaceWithBrandVisual(
    pdf,
    recommendationY + 32,
    brandImagePool.length ? brandImagePool[(sections.length + 3) % brandImagePool.length] : coverImageData,
    'Strategic Focus Areas'
  );

  pdf.setPage(tocPage);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Table of Contents', PAGE_MARGIN, 22);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(splitPdfSafeText(pdf, 'Each section reflects the same filtered overview module content included in the live dashboard.', CONTENT_WIDTH_MM), PAGE_MARGIN, 28);

  let tocY = 42;
  tocEntries.forEach((entry, index) => {
    pdf.setDrawColor(226, 232, 240);
    pdf.line(PAGE_MARGIN, tocY + 1.5, PAGE_WIDTH_MM - PAGE_MARGIN, tocY + 1.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.3);
    pdf.setTextColor(30, 41, 59);
    pdf.text(toPdfSafeText(`${index + 1}. ${entry.title}`), PAGE_MARGIN, tocY);
    pdf.text(String(entry.page), PAGE_WIDTH_MM - PAGE_MARGIN, tocY, { align: 'right' });
    tocY += 10;
  });
};

const createLocationReport = async (locationId: OverviewLocationId, locationName: string, baseData: OverviewDataBundle) => {
  const reportFilters = buildReportFilters(baseData.filters, locationId);
  const filteredData = filterBundleForReport(baseData, reportFilters);
  const periodLabel = formatPeriodLabel(reportFilters.dateRange);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  await buildSectionPages(pdf, locationId, locationName, periodLabel, filteredData);
  decoratePages(pdf, locationName, periodLabel);

  return {
    blob: pdf.output('blob'),
    periodLabel,
  };
};

export const exportDashboardOverviewPDFReports = async ({
  data,
  filters,
  selectedLocations = [],
}: DashboardOverviewExportOptions) => {
  const selectedLocationIds = selectedLocations
    .map((location) => normalizeLocationId(location))
    .filter((locationId): locationId is OverviewLocationId => Boolean(locationId && locationId !== 'all'));

  const exportLocationIds = selectedLocationIds.length
    ? selectedLocationIds.filter((locationId): locationId is Exclude<OverviewLocationId, 'all'> => locationId !== 'all')
    : OVERVIEW_REPORT_LOCATION_IDS;

  const reportBaseData: OverviewDataBundle = {
    ...data,
    filters,
  };

  for (const locationId of exportLocationIds) {
    const locationName = getOverviewLocationLabelById(locationId);
    const { blob, periodLabel } = await createLocationReport(locationId, locationName, reportBaseData);
    const safeLocation = locationName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    const safePeriod = periodLabel.replace(new RegExp(escapeRegExp('/'), 'g'), '-').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    downloadBlob(blob, `PERFORMANCE-REPORT-${safeLocation}-${safePeriod}.pdf`);
  }
};

export default exportDashboardOverviewPDFReports;
