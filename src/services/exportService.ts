/**
 * Export Service
 * Handles exporting data to various formats (PDF, CSV, TXT, DOCX)
 */

import { ExtractedTable, ExtractedMetric, ExtractedData } from './dataExtraction';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export type ExportFormat = 'pdf' | 'csv' | 'txt' | 'json' | 'excel';

/**
 * Format value based on its content and type
 */
function formatValue(value: any): string {
  if (value === null || value === undefined || value === '') return '-';
  
  const str = String(value);
  
  // Check if it's a number (including formatted numbers with commas)
  const numericValue = typeof value === 'number' ? value : parseFloat(str.replace(/[₹,]/g, ''));
  
  if (!isNaN(numericValue)) {
    // If it contains currency symbols or looks like revenue/amount
    if (str.includes('₹') || str.toLowerCase().includes('revenue') || 
        str.toLowerCase().includes('amount') || str.toLowerCase().includes('value')) {
      return formatCurrency(numericValue);
    }
    
    // If it contains % or looks like percentage
    if (str.includes('%') || str.toLowerCase().includes('percentage') || 
        str.toLowerCase().includes('rate') || str.toLowerCase().includes('discount')) {
      // Already a percentage value (0-100)
      return Math.round(numericValue) + '%';
    }
    
    // Regular number - no decimals
    if (numericValue >= 1000) {
      return formatNumber(Math.round(numericValue));
    }
    
    return Math.round(numericValue).toString();
  }
  
  return str;
}

/**
 * Format cell value for display with no decimals
 */
function formatCellValue(value: any, header?: string): string {
  if (value === null || value === undefined || value === '') return '-';
  
  const str = String(value);
  const lowerStr = str.toLowerCase();
  const lowerHeader = (header || '').toLowerCase();
  
  // Parse numeric value
  const numericValue = typeof value === 'number' ? value : parseFloat(str.replace(/[₹,%]/g, ''));
  
  if (!isNaN(numericValue)) {
    // Currency fields
    if (lowerHeader.includes('revenue') || lowerHeader.includes('amount') || 
        lowerHeader.includes('value') || lowerHeader.includes('discount') ||
        lowerHeader.includes('mrp') || lowerHeader.includes('price') ||
        lowerStr.includes('₹')) {
      return formatCurrency(numericValue);
    }
    
    // Percentage fields
    if (lowerHeader.includes('percentage') || lowerHeader.includes('%') || 
        lowerHeader.includes('rate') || lowerStr.includes('%')) {
      return Math.round(numericValue) + '%';
    }
    
    // Count fields (transactions, customers, etc.)
    if (lowerHeader.includes('transaction') || lowerHeader.includes('customer') ||
        lowerHeader.includes('count') || lowerHeader.includes('total') ||
        lowerHeader.includes('member')) {
      return formatNumber(Math.round(numericValue));
    }
    
    // Average fields - round to whole number
    if (lowerHeader.includes('avg') || lowerHeader.includes('average')) {
      return formatCurrency(Math.round(numericValue));
    }
    
    // Default numeric - no decimals
    return formatNumber(Math.round(numericValue));
  }
  
  return str;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExtractedData, filename: string = 'analytics-export') {
  let csvContent = '';

  // Add metadata header
  csvContent += `Export Date,${new Date(data.summary.timestamp).toLocaleString()}\n`;
  csvContent += `Total Tables,${data.summary.totalTables}\n`;
  csvContent += `Total Metrics,${data.summary.totalMetrics}\n`;
  csvContent += `Pages,"${data.summary.pages.join(', ')}"\n`;
  csvContent += `Locations,"${data.summary.locations.join(', ')}"\n`;
  csvContent += '\n';

  // Add metrics section
  if (data.metrics.length > 0) {
    csvContent += '=== METRICS ===\n';
    csvContent += 'Category,Title,Value,Change,Location,Tab,Page\n';
    
    data.metrics.forEach(metric => {
      const formattedValue = formatCellValue(metric.value);
      const formattedChange = metric.change ? formatCellValue(metric.change) : '';
      csvContent += `"${metric.category}","${metric.title}","${formattedValue}","${formattedChange}","${metric.location || ''}","${metric.tab || ''}","${metric.metadata?.page || ''}"\n`;
    });
    csvContent += '\n';
  }

  // Add tables section
  data.tables.forEach((table, index) => {
    csvContent += `\n=== TABLE ${index + 1}: ${table.title} ===\n`;
    csvContent += `ID: ${table.id}\n`;
    if (table.location) csvContent += `Location: ${table.location}\n`;
    if (table.tab) csvContent += `Tab: ${table.tab}\n`;
    if (table.subTab) csvContent += `Sub-Tab: ${table.subTab}\n`;
    if (table.tags && table.tags.length > 0) csvContent += `Tags: ${table.tags.join(', ')}\n`;
    csvContent += `Records: ${table.metadata?.recordCount || table.rows.length}\n\n`;

    // Add headers
    csvContent += table.headers.map(h => `"${h}"`).join(',') + '\n';

    // Add rows with formatted values
    table.rows.forEach(row => {
      const formattedRow = row.map((cell, idx) => {
        const formatted = formatCellValue(cell, table.headers[idx]);
        return `"${String(formatted).replace(/"/g, '""')}"`;
      });
      csvContent += formattedRow.join(',') + '\n';
    });

    csvContent += '\n';
  });

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export data to PDF format with professional styling
 */
export function exportToPDF(data: ExtractedData, filename: string = 'analytics-export') {
  try {
    // Debug log removed for production

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Professional color scheme - softer, more readable
    const colors = {
      primary: [41, 98, 155] as [number, number, number],      // Deep blue
      secondary: [52, 73, 94] as [number, number, number],     // Dark slate
      success: [46, 125, 50] as [number, number, number],      // Forest green
      warning: [245, 124, 0] as [number, number, number],      // Vibrant orange
      danger: [211, 47, 47] as [number, number, number],       // Deep red
      light: [245, 247, 250] as [number, number, number],      // Very light gray
      text: [33, 33, 33] as [number, number, number],          // Almost black
      textLight: [97, 97, 97] as [number, number, number]      // Medium gray
    };

  // Helper function to add page header
  const addPageHeader = () => {
    // Gradient-like header with two-tone design
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Company/title section
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Physique57 Analytics', margin, 12);
    
    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Data Export', margin, 18);
    
    // Date stamp
    doc.setFontSize(9);
    const dateStr = new Date(data.summary.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(dateStr, pageWidth - margin, 12, { align: 'right' });
    
    // Location info if single location
    if (data.summary.locations.length === 1) {
      doc.setFontSize(8);
      doc.text(`📍 ${data.summary.locations[0]}`, pageWidth - margin, 18, { align: 'right' });
    }
  };

  // Helper function to add page footer
  const addPageFooter = () => {
    const pageNumber = doc.getCurrentPageInfo().pageNumber;
    const totalPages = doc.getNumberOfPages();
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    
    // Page number
    doc.setFontSize(8);
    doc.setTextColor(...colors.textLight);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
    
    // Footer text
    doc.text('Physique57 Analytics Hub', margin, pageHeight - 7);
    doc.text('Confidential', pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  // Helper function to check if new page is needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      addPageHeader();
      yPos = 32; // Start below header
      return true;
    }
    return false;
  };

  // Title page with enhanced styling
  addPageHeader();
  yPos = 35;

  // Summary stats in a professional card-style layout
  doc.setFontSize(16);
  doc.setTextColor(...colors.text);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 Export Summary', margin, yPos);
  yPos += 12;

  const statsData = [
    ['Tables Exported', formatNumber(data.summary.totalTables)],
    ['Key Metrics', formatNumber(data.summary.totalMetrics)],
    ['Pages Covered', data.summary.pages.length.toString()],
    ['Locations', data.summary.locations.join(', ')]
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [['Category', 'Details']],
    body: statsData,
    theme: 'plain',
    headStyles: { 
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 4
    },
    bodyStyles: { 
      fontSize: 10,
      textColor: colors.text,
      cellPadding: 4
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, textColor: colors.textLight },
      1: { cellWidth: 'auto', fontStyle: 'bold', textColor: colors.text }
    },
    margin: { left: margin, right: margin },
    styles: {
      lineColor: [230, 230, 230],
      lineWidth: 0.1
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Metrics section with enhanced styling
  if (data.metrics.length > 0) {
    checkNewPage(50);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.text);
    doc.text('📈 Key Performance Metrics', margin, yPos);
    yPos += 10;

    // Show top 40 metrics with better formatting
    const metricsToShow = data.metrics.slice(0, 40);
    const metricsData = metricsToShow.map(m => [
      m.category,
      m.title,
      formatCellValue(m.value),
      m.change ? formatCellValue(m.change) : '-',
      m.location || 'All Locations'
    ]);

    (doc as any).autoTable({
      startY: yPos,
      head: [['Category', 'Metric Name', 'Current Value', 'Change', 'Location']],
      body: metricsData,
      theme: 'striped',
      headStyles: { 
        fillColor: colors.success,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 3
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: colors.text,
        cellPadding: 2.5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold', textColor: colors.textLight },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: colors.primary },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 45, fontSize: 7 }
      },
      alternateRowStyles: {
        fillColor: colors.light
      },
      margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    if (data.metrics.length > 40) {
      doc.setFontSize(8);
      doc.setTextColor(...colors.textLight);
      doc.setFont('helvetica', 'italic');
      doc.text(`Note: Showing top 40 of ${formatNumber(data.metrics.length)} total metrics`, margin, yPos);
      yPos += 8;
    }
  }

  // Tables section - Enhanced professional formatting
  data.tables.forEach((table, tableIndex) => {
    // Start new page for each major table for better readability
    if (tableIndex > 0) {
      doc.addPage();
      addPageHeader();
      yPos = 32;
    }

    // Section divider
    if (tableIndex > 0 && !checkNewPage(15)) {
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
    }

    // Table title with numbering
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.text);
    doc.text(`Table ${tableIndex + 1}: ${table.title}`, margin, yPos);
    yPos += 7;

    // Table ID for easy reference
    doc.setFontSize(7);
    doc.setTextColor(...colors.textLight);
    doc.setFont('helvetica', 'italic');
    doc.text(`ID: ${table.id}`, margin, yPos);
    yPos += 5;

    // Metadata badges with icons and better formatting
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const badges: string[] = [];
    if (table.location) badges.push(`📍 ${table.location}`);
    if (table.tab) badges.push(`📂 ${table.tab}`);
    if (table.metadata?.page) badges.push(`📄 ${table.metadata.page}`);
    badges.push(`📊 ${formatNumber(table.rows.length)} ${table.rows.length === 1 ? 'row' : 'rows'}`);
    
    doc.setTextColor(...colors.textLight);
    doc.text(badges.join('  •  '), margin, yPos);
    yPos += 6;

    // Tags section - NEW!
    if (table.tags && table.tags.length > 0) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const tagsText = `🏷️  ${table.tags.join(' • ')}`;
      doc.setTextColor(100, 100, 100);
      doc.text(tagsText, margin, yPos);
      yPos += 7;
    } else {
      yPos += 2;
    }

    // Format all table data with proper formatting
    const formattedRows = table.rows.map(row => 
      row.map((cell, idx) => formatCellValue(cell, table.headers[idx]))
    );

    // Intelligent column width calculation
    const numCols = table.headers.length;
    const availableWidth = contentWidth;
    
    const columnStyles: any = {};
    const headerWidths: number[] = [];
    
    table.headers.forEach((header, idx) => {
      const lowerHeader = header.toLowerCase();
      let width: number | 'auto' = 'auto';
      let align: 'left' | 'center' | 'right' = 'left';
      let isBold = false;
      
      // ID/Number columns - very narrow
      if (lowerHeader.includes('#') || lowerHeader === 'id' || lowerHeader === 'no') {
        width = 15;
        align = 'center';
      }
      // Count/Percentage columns - narrow
      else if (lowerHeader.includes('count') || lowerHeader.includes('qty') ||
               lowerHeader.includes('percentage') || lowerHeader.includes('%')) {
        width = 22;
        align = 'center';
      }
      // Currency/Amount columns - medium, right-aligned, bold
      else if (lowerHeader.includes('revenue') || lowerHeader.includes('amount') || 
               lowerHeader.includes('value') || lowerHeader.includes('price') ||
               lowerHeader.includes('mrp') || lowerHeader.includes('discount')) {
        width = 28;
        align = 'right';
        isBold = true;
      }
      // Average columns - medium, right-aligned
      else if (lowerHeader.includes('avg') || lowerHeader.includes('average')) {
        width = 26;
        align = 'right';
        isBold = true;
      }
      // Date columns - medium
      else if (lowerHeader.includes('date') || lowerHeader.includes('time')) {
        width = 30;
        align = 'center';
      }
      // Name/Description columns - auto (flexible)
      else if (lowerHeader.includes('name') || lowerHeader.includes('product') || 
               lowerHeader.includes('customer') || lowerHeader.includes('category') ||
               lowerHeader.includes('description')) {
        width = 'auto';
        align = 'left';
      }
      
      columnStyles[idx] = { 
        cellWidth: width,
        halign: align,
        ...(isBold && { fontStyle: 'bold', textColor: colors.primary })
      };
    });

    // Determine font size based on table complexity
    let baseFontSize = 8;
    let headerFontSize = 9;
    
    if (numCols > 10) {
      baseFontSize = 6;
      headerFontSize = 7;
    } else if (numCols > 7) {
      baseFontSize = 7;
      headerFontSize = 8;
    }

    (doc as any).autoTable({
      startY: yPos,
      head: [table.headers],
      body: formattedRows,
      theme: 'grid',
      headStyles: { 
        fillColor: colors.secondary,
        textColor: [255, 255, 255],
        fontSize: headerFontSize,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 3,
        lineColor: [255, 255, 255],
        lineWidth: 0.1
      },
      bodyStyles: { 
        fontSize: baseFontSize,
        textColor: colors.text,
        cellPadding: 2,
        lineColor: [210, 210, 210],
        lineWidth: 0.1
      },
      columnStyles,
      alternateRowStyles: {
        fillColor: [250, 251, 252]
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      didDrawPage: (data) => {
        // Only add footer if we're on a table continuation page
        if (data.pageNumber > 1) {
          addPageFooter();
        }
      },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap',
        minCellHeight: 5,
        halign: 'left'
      },
      // Show all rows - no pagination within tables
      showHead: 'everyPage',
      rowPageBreak: 'auto',
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  });

  // Add final footer to last page
  addPageFooter();

  // Update total page count in all footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter();
  }

  // Save the PDF with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const finalFilename = `${filename}_${timestamp}.pdf`;
  
  // Debug log removed for production
  
  doc.save(finalFilename);
  
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export data to plain text format
 */
export function exportToText(data: ExtractedData, filename: string = 'analytics-export') {
  let textContent = '';

  // Header
  textContent += '═══════════════════════════════════════════════════════\n';
  textContent += '           ANALYTICS EXPORT REPORT\n';
  textContent += '═══════════════════════════════════════════════════════\n\n';

  // Metadata with formatted values
  textContent += `Export Date: ${new Date(data.summary.timestamp).toLocaleString()}\n`;
  textContent += `Total Tables: ${formatNumber(data.summary.totalTables)}\n`;
  textContent += `Total Metrics: ${formatNumber(data.summary.totalMetrics)}\n`;
  textContent += `Pages Included: ${data.summary.pages.join(', ')}\n`;
  textContent += `Locations: ${data.summary.locations.join(', ')}\n`;
  textContent += '\n';

  // Metrics section with formatted values
  if (data.metrics.length > 0) {
    textContent += '═══════════════════════════════════════════════════════\n';
    textContent += '                    KEY METRICS\n';
    textContent += '═══════════════════════════════════════════════════════\n\n';

    const groupedMetrics = groupMetricsByCategory(data.metrics);
    
    Object.entries(groupedMetrics).forEach(([category, metrics]) => {
      textContent += `\n▶ ${category}\n`;
      textContent += '─'.repeat(80) + '\n';
      
      metrics.forEach(metric => {
        const locationInfo = metric.location ? ` [${metric.location}]` : '';
        const formattedValue = formatCellValue(metric.value);
        const changeInfo = metric.change ? ` (${formatCellValue(metric.change)})` : '';
        textContent += `  ${metric.title}${locationInfo}: ${formattedValue}${changeInfo}\n`;
      });
    });

    textContent += '\n';
  }

  // Tables section with formatted values - ALL ROWS
  if (data.tables.length > 0) {
    textContent += '═══════════════════════════════════════════════════════\n';
    textContent += '                      TABLES\n';
    textContent += '═══════════════════════════════════════════════════════\n\n';

    data.tables.forEach((table, index) => {
      textContent += `\n▶ TABLE ${index + 1}: ${table.title}\n`;
      textContent += `  ID: ${table.id}\n`;
      
      const metadata: string[] = [];
      if (table.location) metadata.push(`📍 ${table.location}`);
      if (table.tab) metadata.push(`📂 ${table.tab}`);
      if (table.subTab) metadata.push(`Sub-Tab: ${table.subTab}`);
      metadata.push(`📊 ${formatNumber(table.rows.length)} rows`);
      
      textContent += `  ${metadata.join('  •  ')}\n`;
      
      if (table.tags && table.tags.length > 0) {
        textContent += `  🏷️  Tags: ${table.tags.join(', ')}\n`;
      }
      
      textContent += '─'.repeat(120) + '\n\n';

      // Format all rows
      const formattedRows = table.rows.map(row => 
        row.map((cell, idx) => formatCellValue(cell, table.headers[idx]))
      );

      // Create ASCII table with formatted values
      const colWidths = calculateColumnWidths(table.headers, formattedRows);
      
      // Header
      textContent += '  ' + table.headers.map((h, i) => padString(h, colWidths[i])).join(' │ ') + '\n';
      textContent += '  ' + colWidths.map(w => '─'.repeat(w)).join('─┼─') + '\n';

      // ALL Rows (no limit)
      formattedRows.forEach(row => {
        textContent += '  ' + row.map((cell, i) => padString(String(cell), colWidths[i])).join(' │ ') + '\n';
      });

      textContent += '\n';
    });
  }

  textContent += '═══════════════════════════════════════════════════════\n';
  textContent += '                  END OF REPORT\n';
  textContent += '═══════════════════════════════════════════════════════\n';

  downloadFile(textContent, `${filename}.txt`, 'text/plain;charset=utf-8;');
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: ExtractedData, filename: string = 'analytics-export') {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
}

/**
 * Export data to Excel format (CSV with Excel-friendly formatting)
 */
export function exportToExcel(data: ExtractedData, filename: string = 'analytics-export') {
  // Excel will automatically recognize CSV with UTF-8 BOM
  const BOM = '\uFEFF';
  let csvContent = BOM;

  // Create a workbook-like structure with multiple sheets
  csvContent += 'SHEET: Summary\n';
  csvContent += `Export Date,${new Date(data.summary.timestamp).toLocaleString()}\n`;
  csvContent += `Total Tables,${formatNumber(data.summary.totalTables)}\n`;
  csvContent += `Total Metrics,${formatNumber(data.summary.totalMetrics)}\n`;
  csvContent += `Pages,${data.summary.pages.join(', ')}\n`;
  csvContent += `Locations,${data.summary.locations.join(', ')}\n`;
  csvContent += '\n\n';

  // Metrics sheet with formatted values
  if (data.metrics.length > 0) {
    csvContent += 'SHEET: Metrics\n';
    csvContent += 'Category,Title,Value,Change,Location,Tab,Page\n';
    
    data.metrics.forEach(metric => {
      const formattedValue = formatCellValue(metric.value);
      const formattedChange = metric.change ? formatCellValue(metric.change) : '';
      csvContent += `"${metric.category}","${metric.title}","${formattedValue}","${formattedChange}","${metric.location || ''}","${metric.tab || ''}","${metric.metadata?.page || ''}"\n`;
    });
    csvContent += '\n\n';
  }

  // Each table as a sheet with formatted values
  data.tables.forEach((table, index) => {
    csvContent += `SHEET: ${table.title.substring(0, 30)}\n`;
    csvContent += table.headers.map(h => `"${h}"`).join(',') + '\n';
    
    table.rows.forEach(row => {
      const formattedRow = row.map((cell, idx) => {
        const formatted = formatCellValue(cell, table.headers[idx]);
        return `"${String(formatted).replace(/"/g, '""')}"`;
      });
      csvContent += formattedRow.join(',') + '\n';
    });
    
    csvContent += '\n\n';
  });

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Helper: Download file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper: Group metrics by category
 */
function groupMetricsByCategory(metrics: ExtractedMetric[]): Record<string, ExtractedMetric[]> {
  return metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, ExtractedMetric[]>);
}

/**
 * Helper: Calculate column widths for ASCII table
 */
function calculateColumnWidths(headers: string[], rows: any[][]): number[] {
  const widths = headers.map(h => h.length);
  
  rows.forEach(row => {
    row.forEach((cell, i) => {
      const cellLength = String(cell).length;
      if (cellLength > widths[i]) {
        widths[i] = Math.min(cellLength, 30); // Max width 30
      }
    });
  });

  return widths;
}

/**
 * Helper: Pad string to specific width
 */
function padString(str: string, width: number): string {
  const truncated = str.length > width ? str.substring(0, width - 3) + '...' : str;
  return truncated.padEnd(width, ' ');
}

/**
 * Export single table
 */
export function exportTableToCSV(table: ExtractedTable, filename?: string) {
  const fname = filename || table.title.toLowerCase().replace(/\s+/g, '-');
  
  let csvContent = '';
  csvContent += table.headers.map(h => `"${h}"`).join(',') + '\n';
  table.rows.forEach(row => {
    csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  downloadFile(csvContent, `${fname}.csv`, 'text/csv;charset=utf-8;');
}
