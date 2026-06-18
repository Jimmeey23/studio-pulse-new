import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { LocationReportData, LocationReportMetrics } from '@/hooks/useLocationReportData';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface ReportData {
  location: string;
  dateRange: string;
  sales: {
    totalRevenue: number;
    transactions: number;
    avgTransaction: number;
    uniqueCustomers: number;
  };
  clients: {
    newMembers: number;
    convertedMembers: number;
    retentionRate: number;
    avgLTV: number;
  };
  sessions: {
    totalSessions: number;
    avgClassSize: number;
    avgFillRate: number;
    totalAttendance: number;
  };
  trainers: {
    totalTrainers: number;
    totalSessions: number;
    totalPaid: number;
    avgPerSession: number;
  };
  discounts: {
    discountedSales: number;
    totalDiscount: number;
    avgDiscountPercent: number;
    revenueImpact: number;
  };
  leads: {
    totalLeads: number;
    converted: number;
    conversionRate: number;
    avgResponseTime: number;
  };
  expirations: {
    total: number;
    value: number;
    avgDaysToExpiry: number;
  };
  cancellations: {
    total: number;
    rate: number;
    pattern: string;
  };
}

export const generateHTMLPDFReport = async (data: ReportData): Promise<void> => {
  // Create PDF with A4 dimensions
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Colors
  const primaryColor = '#6366f1'; // Indigo
  const secondaryColor = '#8b5cf6'; // Purple
  const accentColor = '#ec4899'; // Pink
  const textDark = '#1e293b';
  const textLight = '#64748b';

  // Helper function to add new page if needed
  const checkAndAddPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to draw gradient background (simulated with rectangles)
  const drawGradientHeader = () => {
    pdf.setFillColor(99, 102, 241); // Primary color
    pdf.rect(0, 0, pageWidth, 50, 'F');
    pdf.setFillColor(139, 92, 246, 50); // Semi-transparent secondary
    pdf.rect(0, 25, pageWidth, 25, 'F');
  };

  // ============================================
  // PAGE 1: COVER PAGE & EXECUTIVE SUMMARY
  // ============================================
  
  drawGradientHeader();

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Analytics Report', pageWidth / 2, 25, { align: 'center' });

  // Subtitle
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.location, pageWidth / 2, 35, { align: 'center' });

  pdf.setFontSize(12);
  pdf.text(data.dateRange, pageWidth / 2, 42, { align: 'center' });

  yPosition = 60;

  // Executive Summary Section
  pdf.setTextColor(textDark);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', margin, yPosition);
  yPosition += 10;

  // Summary box with key highlights
  pdf.setFillColor(245, 247, 250);
  pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 40, 3, 3, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(textLight);
  
  const summaryText = `This comprehensive report provides insights into business performance across all key metrics including revenue, client retention, class attendance, and operational efficiency for ${data.location}.`;
  const splitText = pdf.splitTextToSize(summaryText, pageWidth - 2 * margin - 10);
  pdf.text(splitText, margin + 5, yPosition + 8);
  
  yPosition += 50;

  // Narrative executive summary
  if ((data as any).summaries?.executive) {
    checkAndAddPage(40);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Narrative Overview', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const execSummary = (data as any).summaries.executive as string;
    const execLines = pdf.splitTextToSize(execSummary, pageWidth - 2 * margin);
    pdf.text(execLines, margin, yPosition);
    yPosition += execLines.length * 4 + 6;
  }

  // ============================================
  // TABLE OF CONTENTS
  // ============================================

  pdf.addPage();
  yPosition = margin;

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Table of Contents', margin, yPosition);
  yPosition += 10;

  const tocSections = [
    'Executive Summary',
    'Sales Performance',
    'Client Conversion & Retention',
    'Sessions & Attendance',
    'Trainer Performance',
    'Discounts & Promotions',
    'Leads & Funnel',
    'Expirations',
    'Late Cancellations',
    'Strategic Recommendations',
  ];

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(textLight);

  tocSections.forEach((title, index) => {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(`${index + 1}. ${title}`, margin, yPosition);
    yPosition += 6;
  });

  // Start main content on a new page
  pdf.addPage();
  yPosition = margin;

  // Key Metrics Grid
  const metricsData = [
    { label: 'Total Revenue', value: formatCurrency(data.sales.totalRevenue), color: [34, 197, 94] },
    { label: 'Total Transactions', value: formatNumber(data.sales.transactions), color: [59, 130, 246] },
    { label: 'New Members', value: formatNumber(data.clients.newMembers), color: [168, 85, 247] },
    { label: 'Total Sessions', value: formatNumber(data.sessions.totalSessions), color: [236, 72, 153] },
  ];

  const boxWidth = (pageWidth - 2 * margin - 15) / 2;
  const boxHeight = 28;
  const boxGap = 5;

  metricsData.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + col * (boxWidth + boxGap);
    const y = yPosition + row * (boxHeight + boxGap);

    // Box background
    pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2], 20);
    pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'F');

    // Border
    pdf.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'S');

    // Label
    pdf.setFontSize(9);
    pdf.setTextColor(textLight);
    pdf.setFont('helvetica', 'normal');
    pdf.text(metric.label, x + 5, y + 8);

    // Value
    pdf.setFontSize(18);
    pdf.setTextColor(textDark);
    pdf.setFont('helvetica', 'bold');
    pdf.text(metric.value, x + 5, y + 20);
  });

  yPosition += 2 * (boxHeight + boxGap) + 15;

  // ============================================
  // SALES ANALYTICS SECTION
  // ============================================
  
  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Sales Performance', margin, yPosition);
  yPosition += 8;

  // Sales metrics table
  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Revenue', formatCurrency(data.sales.totalRevenue)],
      ['Total Transactions', formatNumber(data.sales.transactions)],
      ['Average Transaction', formatCurrency(data.sales.avgTransaction)],
      ['Unique Customers', formatNumber(data.sales.uniqueCustomers)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Sales insights
  if ((data as any).summaries?.sales) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const salesSummary = (data as any).summaries.sales as string;
    const salesLines = pdf.splitTextToSize(salesSummary, pageWidth - 2 * margin);
    pdf.text(salesLines, margin, yPosition);
    yPosition += salesLines.length * 4 + 8;
  }

  // ============================================
  // CLIENT RETENTION SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Client Conversion & Retention', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['New Members', formatNumber(data.clients.newMembers)],
      ['Converted Members', formatNumber(data.clients.convertedMembers)],
      ['Retention Rate', formatPercentage(data.clients.retentionRate)],
      ['Average LTV', formatCurrency(data.clients.avgLTV)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Clients insights
  if ((data as any).summaries?.clients) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const clientSummary = (data as any).summaries.clients as string;
    const clientLines = pdf.splitTextToSize(clientSummary, pageWidth - 2 * margin);
    pdf.text(clientLines, margin, yPosition);
    yPosition += clientLines.length * 4 + 8;
  }

  // ============================================
  // SESSIONS & ATTENDANCE SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Sessions & Attendance', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Sessions', formatNumber(data.sessions.totalSessions)],
      ['Average Class Size', formatNumber(data.sessions.avgClassSize)],
      ['Average Fill Rate', formatPercentage(data.sessions.avgFillRate)],
      ['Total Attendance', formatNumber(data.sessions.totalAttendance)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Sessions insights
  if ((data as any).summaries?.sessions) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const sessionsSummary = (data as any).summaries.sessions as string;
    const sessionsLines = pdf.splitTextToSize(sessionsSummary, pageWidth - 2 * margin);
    pdf.text(sessionsLines, margin, yPosition);
    yPosition += sessionsLines.length * 4 + 8;
  }

  // ============================================
  // TRAINER PERFORMANCE SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Trainer Performance', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Trainers', formatNumber(data.trainers.totalTrainers)],
      ['Total Sessions', formatNumber(data.trainers.totalSessions)],
      ['Total Compensation', formatCurrency(data.trainers.totalPaid)],
      ['Avg Per Session', formatCurrency(data.trainers.avgPerSession)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [168, 85, 247],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Trainer insights
  if ((data as any).summaries?.trainers) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const trainerSummary = (data as any).summaries.trainers as string;
    const trainerLines = pdf.splitTextToSize(trainerSummary, pageWidth - 2 * margin);
    pdf.text(trainerLines, margin, yPosition);
    yPosition += trainerLines.length * 4 + 8;
  }

  // ============================================
  // NEW PAGE FOR ADDITIONAL METRICS
  // ============================================

  pdf.addPage();
  yPosition = margin;

  // ============================================
  // DISCOUNTS & PROMOTIONS SECTION
  // ============================================

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Discounts & Promotions', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Discounted Sales', formatNumber(data.discounts.discountedSales)],
      ['Total Discount Amount', formatCurrency(data.discounts.totalDiscount)],
      ['Average Discount %', formatPercentage(data.discounts.avgDiscountPercent)],
      ['Revenue Impact', formatCurrency(data.discounts.revenueImpact)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [236, 72, 153],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Discounts insights
  if ((data as any).summaries?.discounts) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const discountsSummary = (data as any).summaries.discounts as string;
    const discountsLines = pdf.splitTextToSize(discountsSummary, pageWidth - 2 * margin);
    pdf.text(discountsLines, margin, yPosition);
    yPosition += discountsLines.length * 4 + 8;
  }

  // ============================================
  // LEADS & FUNNEL SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Leads & Conversion Funnel', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Leads', formatNumber(data.leads.totalLeads)],
      ['Converted Leads', formatNumber(data.leads.converted)],
      ['Conversion Rate', formatPercentage(data.leads.conversionRate)],
      ['Avg Response Time', `${data.leads.avgResponseTime} hours`],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Leads insights
  if ((data as any).summaries?.leads) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const leadsSummary = (data as any).summaries.leads as string;
    const leadsLines = pdf.splitTextToSize(leadsSummary, pageWidth - 2 * margin);
    pdf.text(leadsLines, margin, yPosition);
    yPosition += leadsLines.length * 4 + 8;
  }

  // ============================================
  // EXPIRATIONS SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Package Expirations', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Expirations', formatNumber(data.expirations.total)],
      ['Expiration Value', formatCurrency(data.expirations.value)],
      ['Avg Days to Expiry', `${data.expirations.avgDaysToExpiry} days`],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [251, 146, 60],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Expirations insights
  if ((data as any).summaries?.expirations) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const expSummary = (data as any).summaries.expirations as string;
    const expLines = pdf.splitTextToSize(expSummary, pageWidth - 2 * margin);
    pdf.text(expLines, margin, yPosition);
    yPosition += expLines.length * 4 + 8;
  }

  // ============================================
  // LATE CANCELLATIONS SECTION
  // ============================================

  checkAndAddPage(60);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textDark);
  pdf.text('Late Cancellations', margin, yPosition);
  yPosition += 8;

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Total Cancellations', formatNumber(data.cancellations.total)],
      ['Cancellation Rate', formatPercentage(data.cancellations.rate)],
      ['Primary Pattern', data.cancellations.pattern],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [239, 68, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPosition = pdf.lastAutoTable?.finalY || yPosition + 50;
  yPosition += 8;

  // Late cancellations insights
  if ((data as any).summaries?.cancellations) {
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textDark);
    pdf.text('Insights & Recommendations', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textLight);
    const cancelSummary = (data as any).summaries.cancellations as string;
    const cancelLines = pdf.splitTextToSize(cancelSummary, pageWidth - 2 * margin);
    pdf.text(cancelLines, margin, yPosition);
    yPosition += cancelLines.length * 4 + 8;
  }

  // ============================================
  // FOOTER WITH TIMESTAMP
  // ============================================

  checkAndAddPage(30);

  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 18, 'F');

  pdf.setFontSize(8);
  pdf.setTextColor(textLight);
  pdf.setFont('helvetica', 'italic');
  const timestamp = new Date().toLocaleString();
  pdf.text(`Report generated on ${timestamp}`, margin + 5, yPosition + 7);
  pdf.text('Physique 57 Analytics Hub', margin + 5, yPosition + 13);

  // ============================================
  // FOOTERS WITH PAGE NUMBERS
  // ============================================

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    pdf.text('© 2025 Physique 57', pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // ============================================
  // SAVE PDF
  // ============================================

  const fileName = `${data.location.replace(/[^a-z0-9]/gi, '_')}_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

// Generate report for multiple locations
export const generateMultiLocationHTMLPDFReports = async (
  locationsData: ReportData[],
  onProgress?: (message: string) => void
): Promise<void> => {
  for (const locationData of locationsData) {
    if (onProgress) {
      onProgress(`Generating report for ${locationData.location}...`);
    }
    await generateHTMLPDFReport(locationData);
    // Small delay between reports
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (onProgress) {
    onProgress('All reports generated successfully!');
  }
};

const renderLocationReportIntoPDF = (pdf: jsPDF, reportData: LocationReportData): void => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // ============================================
  // HEADER SECTION
  // ============================================
  
  // Title
  pdf.setFontSize(24);
  pdf.setTextColor(59, 130, 246); // Blue color
  pdf.setFont('helvetica', 'bold');
  pdf.text('Location Performance Report', margin, yPos);
  yPos += 15;

  // Location and Period
  pdf.setFontSize(16);
  pdf.setTextColor(55, 65, 81); // Dark gray
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportData.location, margin, yPos);
  yPos += 8;
  
  pdf.setFontSize(12);
  pdf.setTextColor(107, 114, 128); // Gray
  pdf.text(`Report Period: ${reportData.reportPeriod.monthName}`, margin, yPos);
  yPos += 5;
  
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPos);
  yPos += 15;

  // Performance Score Box
  const scoreBoxWidth = 60;
  const scoreBoxHeight = 20;
  const scoreX = pageWidth - margin - scoreBoxWidth;
  
  pdf.setFillColor(59, 130, 246);
  pdf.roundedRect(scoreX, yPos - 15, scoreBoxWidth, scoreBoxHeight, 3, 3, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Performance Score', scoreX + 30, yPos - 8, { align: 'center' });
  pdf.setFontSize(16);
  pdf.text(`${reportData.metrics.overallScore}/100`, scoreX + 30, yPos - 2, { align: 'center' });

  yPos += 15;

  // ============================================
  // EXECUTIVE SUMMARY
  // ============================================
  
  pdf.setFontSize(16);
  pdf.setTextColor(55, 65, 81);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', margin, yPos);
  yPos += 10;

  // Key metrics in a grid
  const metrics = [
    { label: 'Total Revenue', value: formatCurrency(reportData.metrics.totalRevenue) },
    { label: 'Fill Rate', value: formatPercentage(reportData.metrics.fillRate) },
    { label: 'Retention Rate', value: formatPercentage(reportData.metrics.retentionRate) },
    { label: 'Conversion Rate', value: formatPercentage(reportData.metrics.conversionRate) },
    { label: 'New Clients', value: formatNumber(reportData.metrics.newClientsAcquired) },
    { label: 'Total Sessions', value: formatNumber(reportData.metrics.totalSessions) }
  ];

  const cols = 3;
  const rows = Math.ceil(metrics.length / cols);
  const cellWidth = (pageWidth - 2 * margin) / cols;
  const cellHeight = 15;

  for (let i = 0; i < metrics.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * cellWidth;
    const y = yPos + row * cellHeight;

    // Background for alternating rows
    if (row % 2 === 0) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(x, y - 5, cellWidth, cellHeight, 'F');
    }

    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text(metrics[i].label, x + 2, y);
    
    pdf.setFontSize(12);
    pdf.setTextColor(17, 24, 39);
    pdf.setFont('helvetica', 'bold');
    pdf.text(metrics[i].value, x + 2, y + 7);
  }

  yPos += rows * cellHeight + 15;

  // ============================================
  // REVENUE PERFORMANCE SECTION
  // ============================================
  
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    yPos = margin;
  }

  pdf.setFontSize(14);
  pdf.setTextColor(59, 130, 246);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Revenue Performance', margin, yPos);
  yPos += 10;

  const revenueData = [
    ['Metric', 'Value'],
    ['Gross Revenue', formatCurrency(reportData.metrics.totalRevenue)],
    ['Net Revenue', formatCurrency(reportData.metrics.netRevenue)],
    ['VAT Amount', formatCurrency(reportData.metrics.vatAmount)],
    ['Total Transactions', formatNumber(reportData.metrics.totalTransactions)],
    ['Unique Members', formatNumber(reportData.metrics.uniqueMembers)],
    ['Avg Transaction Value', formatCurrency(reportData.metrics.avgTransactionValue)],
    ['Avg Spend per Member', formatCurrency(reportData.metrics.avgSpendPerMember)],
    ['Total Discounts', formatCurrency(reportData.metrics.totalDiscounts)],
    ['Discount Rate', formatPercentage(reportData.metrics.discountRate)]
  ];

  pdf.autoTable({
    startY: yPos,
    head: [revenueData[0]],
    body: revenueData.slice(1),
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  });

  yPos = pdf.lastAutoTable?.finalY || yPos + 60;
  yPos += 15;

  // ============================================
  // SESSION PERFORMANCE SECTION
  // ============================================
  
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    yPos = margin;
  }

  pdf.setFontSize(14);
  pdf.setTextColor(16, 185, 129);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Session Performance', margin, yPos);
  yPos += 10;

  const sessionData = [
    ['Metric', 'Value'],
    ['Total Sessions', formatNumber(reportData.metrics.totalSessions)],
    ['Total Check-ins', formatNumber(reportData.metrics.totalCheckIns)],
    ['Fill Rate', formatPercentage(reportData.metrics.fillRate)],
    ['Average Class Size', formatNumber(reportData.metrics.avgClassSize)],
    ['PowerCycle Sessions', formatNumber(reportData.metrics.powerCycleSessions)],
    ['Barre Sessions', formatNumber(reportData.metrics.barreSessions)],
    ['Strength Sessions', formatNumber(reportData.metrics.strengthSessions)],
    ['Late Cancellations', formatNumber(reportData.metrics.lateCancellations)]
  ];

  pdf.autoTable({
    startY: yPos,
    head: [sessionData[0]],
    body: sessionData.slice(1),
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  });

  yPos = pdf.lastAutoTable?.finalY || yPos + 60;
  yPos += 15;

  // ============================================
  // CLIENT RETENTION SECTION
  // ============================================
  
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    yPos = margin;
  }

  pdf.setFontSize(14);
  pdf.setTextColor(139, 92, 246);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Client Acquisition & Retention', margin, yPos);
  yPos += 10;

  const clientData = [
    ['Metric', 'Value'],
    ['New Clients Acquired', formatNumber(reportData.metrics.newClientsAcquired)],
    ['Conversion Rate', formatPercentage(reportData.metrics.conversionRate)],
    ['Retention Rate', formatPercentage(reportData.metrics.retentionRate)],
    ['Average LTV', formatCurrency(reportData.metrics.averageLTV)],
    ['Churn Rate', formatPercentage(reportData.metrics.churnRate)],
    ['Churned Members', formatNumber(reportData.metrics.churnedMembers)]
  ];

  pdf.autoTable({
    startY: yPos,
    head: [clientData[0]],
    body: clientData.slice(1),
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [139, 92, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  });

  yPos = pdf.lastAutoTable?.finalY || yPos + 60;
  yPos += 15;

  // ============================================
  // TRAINER PERFORMANCE SECTION
  // ============================================
  
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    yPos = margin;
  }

  pdf.setFontSize(14);
  pdf.setTextColor(245, 158, 11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Trainer Performance', margin, yPos);
  yPos += 10;

  const trainerData = [
    ['Metric', 'Value'],
    ['Total Trainers', formatNumber(reportData.metrics.totalTrainers)],
    ['Sessions per Trainer', formatNumber(reportData.metrics.sessionsPerTrainer)],
    ['Revenue per Trainer', formatCurrency(reportData.metrics.revenuePerTrainer)],
    ['Top Trainer', reportData.metrics.topTrainerName],
    ['Top Trainer Revenue', formatCurrency(reportData.metrics.topTrainerRevenue)]
  ];

  pdf.autoTable({
    startY: yPos,
    head: [trainerData[0]],
    body: trainerData.slice(1),
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [245, 158, 11], textColor: 255 },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  });

  yPos = pdf.lastAutoTable?.finalY || yPos + 60;
  yPos += 15;

  // ============================================
  // INSIGHTS SECTION
  // ============================================
  
  if (yPos > pageHeight - 80) {
    pdf.addPage();
    yPos = margin;
  }

  pdf.setFontSize(14);
  pdf.setTextColor(220, 38, 127);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Insights & Recommendations', margin, yPos);
  yPos += 15;

  // Highlights
  if (reportData.insights.highlights.length > 0) {
    pdf.setFontSize(12);
    pdf.setTextColor(16, 185, 129);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Highlights:', margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'normal');
    
    reportData.insights.highlights.forEach(highlight => {
      pdf.text(`• ${highlight}`, margin + 5, yPos);
      yPos += 6;
    });
    yPos += 5;
  }

  // Concerns
  if (reportData.insights.concerns.length > 0) {
    pdf.setFontSize(12);
    pdf.setTextColor(239, 68, 68);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Areas of Concern:', margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'normal');
    
    reportData.insights.concerns.forEach(concern => {
      pdf.text(`• ${concern}`, margin + 5, yPos);
      yPos += 6;
    });
    yPos += 5;
  }

  // Recommendations
  if (reportData.insights.recommendations.length > 0) {
    pdf.setFontSize(12);
    pdf.setTextColor(59, 130, 246);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recommendations:', margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'normal');
    
    reportData.insights.recommendations.forEach(recommendation => {
      pdf.text(`• ${recommendation}`, margin + 5, yPos);
      yPos += 6;
    });
  }

  // Do not add page numbers or save here; handled by outer generator.
};

// Generate Location Performance Report PDF (single or multi-report)
export const generateLocationReportPDF = async (
  reportData: LocationReportData | LocationReportData[]
): Promise<void> => {
  const reports = Array.isArray(reportData) ? reportData : [reportData];
  if (reports.length === 0) return;

  const pdf = new jsPDF('p', 'mm', 'a4');

  reports.forEach((r, idx) => {
    if (idx > 0) pdf.addPage();
    renderLocationReportIntoPDF(pdf, r);
  });

  // ============================================
  // FOOTER WITH PAGE NUMBERS (across whole PDF)
  // ============================================
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    pdf.text('© 2025 Physique 57 - Location Performance Report', pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // ============================================
  // SAVE PDF
  // ============================================
  const dateStamp = new Date().toISOString().split('T')[0];
  const fileName =
    reports.length === 1
      ? `${reports[0].location.replace(/[^a-z0-9]/gi, '_')}_Location_Report_${dateStamp}.pdf`
      : `All_Locations_Location_Reports_${dateStamp}.pdf`;

  pdf.save(fileName);
};
