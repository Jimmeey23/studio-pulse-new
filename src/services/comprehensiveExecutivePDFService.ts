import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface ExecutiveReportSection {
  title: string;
  metrics: Array<{
    label: string;
    value: string | number;
    format?: 'currency' | 'number' | 'percentage' | 'text';
  }>;
  description?: string;
  tableData?: {
    headers: string[];
    rows: any[][];
  };
  color: [number, number, number];
}

interface ComprehensiveExecutiveReportData {
  dateRange: string;
  location: string;
  sections: ExecutiveReportSection[];
  executiveSummary?: string;
  recommendations?: string[];
}

export type { ComprehensiveExecutiveReportData };

export const generateComprehensiveExecutivePDF = async (
  reportData: ComprehensiveExecutiveReportData
): Promise<Blob> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Color palette
  const colors = {
    primary: [99, 102, 241],      // Indigo
    secondary: [139, 92, 246],    // Purple
    accent: [236, 72, 153],       // Pink
    success: [34, 197, 94],       // Emerald
    warning: [249, 115, 22],      // Amber
    danger: [239, 68, 68],        // Red
    dark: [30, 41, 59],           // Slate-900
    light: [100, 116, 139],       // Slate-500
    border: [226, 232, 240],      // Slate-200
  };

  // Helper functions
  const checkAndAddPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin - 10) {
      pdf.addPage();
      yPosition = margin;
      // Add page footer
      addPageFooter();
      return true;
    }
    return false;
  };

  const addPageFooter = () => {
    const footerY = pageHeight - 10;
    pdf.setFontSize(8);
    pdf.setTextColor(colors.light[0], colors.light[1], colors.light[2]);
    pdf.text(`Generated: ${new Date().toLocaleDateString()} • ${reportData.location}`, margin, footerY);
    pdf.text(`Page ${pdf.getNumberOfPages()}`, pageWidth - margin - 20, footerY);
  };

  const drawSectionHeader = (title: string, sectionColor: [number, number, number]) => {
    // Compact header with colored background
    pdf.setFillColor(sectionColor[0], sectionColor[1], sectionColor[2]);
    pdf.rect(margin, yPosition, contentWidth, 9, 'F');

    // Colored line on left
    pdf.setDrawColor(sectionColor[0], sectionColor[1], sectionColor[2]);
    pdf.setLineWidth(2);
    pdf.line(margin, yPosition, margin, yPosition + 9);

    // Title
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    pdf.text(title, margin + 4, yPosition + 6);

    yPosition += 11;
  };

  const drawMetricGrid = (
    metrics: Array<{ label: string; value: string | number }>,
    sectionColor: [number, number, number]
  ) => {
    const metricsPerRow = 4; // More metrics per row for compact layout
    const spacing = 2;
    const boxWidth = (contentWidth - (metricsPerRow - 1) * spacing) / metricsPerRow;
    const boxHeight = 18; // Reduced height

    metrics.forEach((metric, index) => {
      const col = index % metricsPerRow;
      const row = Math.floor(index / metricsPerRow);
      const x = margin + col * (boxWidth + spacing);
      const y = yPosition + row * (boxHeight + 2);

      // Background - more saturated color
      pdf.setFillColor(sectionColor[0], sectionColor[1], sectionColor[2]);
      pdf.roundedRect(x, y, boxWidth, boxHeight, 1.5, 1.5, 'F');

      // Border - darker for visibility
      pdf.setDrawColor(sectionColor[0], sectionColor[1], sectionColor[2]);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(x, y, boxWidth, boxHeight, 1.5, 1.5, 'S');

      // Label - dark color for visibility
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 84, 97); // Darker slate
      pdf.text(metric.label, x + 2, y + 4.5);

      // Value - bold and dark
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      const valueStr = String(metric.value);
      pdf.text(valueStr, x + 2, y + 13);
    });

    const rows = Math.ceil(metrics.length / metricsPerRow);
    yPosition += rows * (boxHeight + 2) + 4;
  };

  const drawMetricsTable = (
    headers: string[],
    rows: any[][],
    sectionColor: [number, number, number]
  ) => {
    checkAndAddPage(60);

    autoTable(pdf, {
      startY: yPosition,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: sectionColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [colors.dark[0], colors.dark[1], colors.dark[2]],
        cellPadding: 1.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      columnStyles: headers.reduce((acc: any, _: string, idx: number) => {
        acc[idx] = { halign: idx === 0 ? 'left' : 'center', cellPadding: 1.5 };
        return acc;
      }, {}),
    });

    yPosition = (pdf.lastAutoTable?.finalY || yPosition) + 3;
  };

  // ============================================
  // PAGE 1: COVER PAGE
  // ============================================

  // Gradient header
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, pageWidth, 80, 'F');

  pdf.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2], 40);
  pdf.rect(0, 40, pageWidth, 40, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Performance Report', pageWidth / 2, 35, { align: 'center' });

  // Location & Date
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportData.location, pageWidth / 2, 50, { align: 'center' });
  pdf.setFontSize(11);
  pdf.text(reportData.dateRange, pageWidth / 2, 57, { align: 'center' });

  yPosition = 100;

  // Executive Summary
  if (reportData.executiveSummary) {
    pdf.setFillColor(245, 247, 250);
    pdf.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, 'F');

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    pdf.text('Executive Summary', margin + 4, yPosition + 6);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.light[0], colors.light[1], colors.light[2]);
    const summaryLines = pdf.splitTextToSize(reportData.executiveSummary, contentWidth - 8);
    pdf.text(summaryLines, margin + 4, yPosition + 12);

    yPosition += 45;
  }

  // ============================================
  // TABLE OF CONTENTS
  // ============================================

  pdf.addPage();
  yPosition = margin;

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  pdf.text('Table of Contents', margin, yPosition);
  yPosition += 12;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.light[0], colors.light[1], colors.light[2]);

  reportData.sections.forEach((section, index) => {
    if (yPosition > pageHeight - margin - 10) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(`${index + 1}. ${section.title}`, margin + 5, yPosition);
    yPosition += 7;
  });

  // ============================================
  // MAIN SECTIONS
  // ============================================

  reportData.sections.forEach((section) => {
    pdf.addPage();
    yPosition = margin;
    addPageFooter();

    // Section header - compact
    drawSectionHeader(section.title, section.color);

    // Description if available
    if (section.description) {
      checkAndAddPage(12);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139); // Darker slate
      const descLines = pdf.splitTextToSize(section.description, contentWidth);
      pdf.text(descLines, margin, yPosition);
      yPosition += descLines.length * 3 + 2;
    }

    // Metric cards/grid - compact
    if (section.metrics.length > 0) {
      checkAndAddPage(35);
      drawMetricGrid(
        section.metrics.map((m) => ({
          label: m.label,
          value: m.value,
        })),
        section.color
      );
    }

    // Table if available - compact
    if (section.tableData && section.tableData.rows.length > 0) {
      checkAndAddPage(50);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      pdf.text(`${section.title} - Details`, margin, yPosition);
      yPosition += 6;

      drawMetricsTable(section.tableData.headers, section.tableData.rows, section.color);
    }
  });

  // ============================================
  // RECOMMENDATIONS PAGE
  // ============================================

  if (reportData.recommendations && reportData.recommendations.length > 0) {
    pdf.addPage();
    yPosition = margin;

    // Header
    drawSectionHeader('Strategic Recommendations', colors.accent as [number, number, number]);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);

    reportData.recommendations.forEach((rec, index) => {
      checkAndAddPage(20);

      // Bullet point
      pdf.text(`${index + 1}.`, margin, yPosition);

      // Recommendation text
      const recLines = pdf.splitTextToSize(rec, contentWidth - 10);
      pdf.text(recLines, margin + 5, yPosition);

      yPosition += recLines.length * 4 + 6;
    });
  }

  // Add footer to last page
  addPageFooter();

  return pdf.output('blob');
};

export const downloadComprehensiveExecutivePDF = async (
  reportData: ComprehensiveExecutiveReportData,
  filename?: string
): Promise<void> => {
  const blob = await generateComprehensiveExecutivePDF(reportData);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `Executive_Report_${new Date().getTime()}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

export default generateComprehensiveExecutivePDF;
