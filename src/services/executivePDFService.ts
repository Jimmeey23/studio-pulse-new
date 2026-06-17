import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesData, PayrollData, NewClientData, LateCancellationsData, ExpirationData } from '@/types/dashboard';
import type { SessionData } from '@/hooks/useSessionsData';
import type { DiscountAnalysisData } from '@/hooks/useDiscountAnalysis';
import type { LeadsData } from '@/types/leads';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { getPreviousMonthDateRange } from '@/utils/dateUtils';

interface ReportData {
  sales: SalesData[];
  sessions: SessionData[];
  payroll: PayrollData[];
  newClients: NewClientData[];
  leads: LeadsData[];
  discounts: DiscountAnalysisData[];
  lateCancellations?: LateCancellationsData[];
  expirations?: ExpirationData[];
}

interface ReportConfig {
  locationName: string;
  monthYear: string;
  periodStart: Date;
  periodEnd: Date;
}

// Premium color palette for professional PDF styling
const COLORS = {
  // Primary brand colors
  brandPrimary: [30, 64, 175] as [number, number, number],      // Deep Blue
  brandSecondary: [124, 58, 237] as [number, number, number],   // Royal Purple
  brandAccent: [236, 72, 153] as [number, number, number],      // Vibrant Pink
  
  // Functional colors
  success: [16, 185, 129] as [number, number, number],          // Emerald Green
  warning: [245, 158, 11] as [number, number, number],          // Amber
  danger: [239, 68, 68] as [number, number, number],            // Red
  info: [59, 130, 246] as [number, number, number],             // Sky Blue
  
  // Neutral colors
  dark: [15, 23, 42] as [number, number, number],               // Slate 900
  mediumDark: [51, 65, 85] as [number, number, number],         // Slate 700
  medium: [100, 116, 139] as [number, number, number],          // Slate 500
  light: [148, 163, 184] as [number, number, number],           // Slate 400
  veryLight: [226, 232, 240] as [number, number, number],       // Slate 200
  background: [248, 250, 252] as [number, number, number],      // Slate 50
  white: [255, 255, 255] as [number, number, number],
  
  // Gradient colors
  gradientStart: [79, 70, 229] as [number, number, number],     // Indigo 600
  gradientMid: [139, 92, 246] as [number, number, number],      // Violet 500
  gradientEnd: [219, 39, 119] as [number, number, number]       // Pink 600
};

export class ExecutivePDFReportGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 280;
  private pageWidth: number = 210;
  private margin: number = 15;
  private pageNumber: number = 1;
  private config: ReportConfig;
  private locationData: ReportData;

  constructor(config: ReportConfig) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.config = config;
    this.locationData = { sales: [], sessions: [], payroll: [], newClients: [], leads: [], discounts: [] };
  }

  /**
   * Filter data for the specific previous month and location
   */
  private filterDataForLocation(allData: ReportData, locationName: string): ReportData {
    const { periodStart, periodEnd } = this.config;
    
    const isInPeriod = (dateStr: string): boolean => {
      if (!dateStr) return false;
      try {
        // Handle DD/MM/YYYY format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          return date >= periodStart && date <= periodEnd;
        }
        const date = new Date(dateStr);
        return date >= periodStart && date <= periodEnd;
      } catch {
        return false;
      }
    };

    const matchesLocation = (itemLocation: string | undefined): boolean => {
      if (!itemLocation) return false;
      return itemLocation === locationName || locationName === 'All Locations';
    };

    return {
      sales: allData.sales.filter(s => 
        isInPeriod(s.paymentDate) && matchesLocation(s.calculatedLocation)
      ),
      sessions: allData.sessions.filter(s => 
        isInPeriod(s.date) && matchesLocation(s.location)
      ),
      payroll: allData.payroll.filter(p => {
        // Parse payroll monthYear like "Sep 2025" or "September 2025" and compare to target period's month/year
        let payrollDate: Date | null = null;
        if (p.monthYear) {
          const d = new Date(p.monthYear);
          if (!isNaN(d.getTime())) payrollDate = d;
        }

        const targetMonth = this.config.periodStart.getMonth();
        const targetYear = this.config.periodStart.getFullYear();
        const monthMatch = payrollDate ? (payrollDate.getMonth() === targetMonth && payrollDate.getFullYear() === targetYear) : false;
        return monthMatch && matchesLocation(p.location);
      }),
      newClients: allData.newClients.filter(n => 
        isInPeriod(n.firstVisitDate) && matchesLocation(n.homeLocation)
      ),
      leads: allData.leads.filter(l => {
        const createdMatch = l.createdAt ? isInPeriod(l.createdAt) : false;
        return createdMatch && matchesLocation(l.center);
      }),
      discounts: allData.discounts.filter(d => 
        isInPeriod(d.paymentDate) && matchesLocation(d.location)
      ),
      lateCancellations: allData.lateCancellations?.filter(c => 
        isInPeriod(c.dateIST || '') && matchesLocation(c.location)
      ),
      expirations: allData.expirations?.filter(e => 
        isInPeriod(e.endDate) && matchesLocation(e.homeLocation)
      )
    };
  }

  /**
   * Generate comprehensive executive report
   */
  async generateReport(allData: ReportData): Promise<Blob> {
    // Filter data for this location and period
    this.locationData = this.filterDataForLocation(allData, this.config.locationName);
    
    // PDF generation started for location and month
    
    // Generate all sections
    this.addCoverPage();
    this.addNewPage();
    this.addExecutiveSummary();
    this.addNewPage();
    this.addSalesAnalytics();
    this.addNewPage();
    this.addFunnelAndLeads();
    this.addNewPage();
    this.addClientRetentionConversion();
    this.addNewPage();
    this.addClassAttendance();
    this.addNewPage();
    this.addLateCancellations();
    this.addNewPage();
    this.addDiscountsPromotions();
    
    if (this.locationData.expirations && this.locationData.expirations.length > 0) {
      this.addNewPage();
      this.addExpirations();
    }
    
    this.addNewPage();
    this.addPowerCycleBarreStrength();
    this.addNewPage();
    this.addTrainerPerformance();
    this.addNewPage();
    this.addStrategicRecommendations();

    return this.doc.output('blob');
  }

  // ==================== PREMIUM COVER PAGE ====================
  private addCoverPage() {
    const centerX = this.pageWidth / 2;
    
    // Premium gradient background with multiple layers
    this.doc.setFillColor(...COLORS.gradientStart);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Gradient overlay simulation
    for (let i = 0; i < 50; i++) {
      const alpha = (50 - i) / 100;
      this.doc.setFillColor(139, 92, 246, alpha);
      this.doc.rect(0, i * (this.pageHeight / 50), this.pageWidth, this.pageHeight / 50, 'F');
    }
    
    // Decorative circles
    this.doc.setFillColor(255, 255, 255, 0.05);
    this.doc.circle(centerX - 60, 50, 80, 'F');
    this.doc.circle(centerX + 70, 200, 60, 'F');
    this.doc.circle(centerX - 40, 250, 40, 'F');
    
    // Premium logo container
    this.doc.setFillColor(255, 255, 255, 0.15);
    this.doc.setDrawColor(255, 255, 255, 0.3);
    this.doc.setLineWidth(2);
    const logoSize = 70;
    this.doc.roundedRect(
      centerX - logoSize / 2,
      30,
      logoSize,
      logoSize,
      10,
      10,
      'FD'
    );
    
    // Company name with premium styling
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(22);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PHYSIQUE 57', centerX, 120, { align: 'center' });
    
    // Decorative line
    this.doc.setDrawColor(255, 255, 255, 0.5);
    this.doc.setLineWidth(0.5);
    this.doc.line(centerX - 40, 125, centerX + 40, 125);
    
    // Main title with shadow effect
    this.doc.setFontSize(42);
    this.doc.setFont('helvetica', 'bold');
    // Shadow
    this.doc.setTextColor(0, 0, 0, 0.3);
    this.doc.text('EXECUTIVE', centerX + 1, 146, { align: 'center' });
    this.doc.text('REPORT', centerX + 1, 163, { align: 'center' });
    // Main text
    this.doc.setTextColor(...COLORS.white);
    this.doc.text('EXECUTIVE', centerX, 145, { align: 'center' });
    this.doc.text('REPORT', centerX, 162, { align: 'center' });
    
    // Subtitle with elegant styling
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(255, 255, 255, 0.9);
    this.doc.text('Monthly Performance Analytics & Strategic Insights', centerX, 175, { align: 'center' });
    
    // Premium location badge
    this.doc.setFillColor(255, 255, 255, 0.2);
    this.doc.setDrawColor(255, 255, 255, 0.4);
    this.doc.setLineWidth(1.5);
    this.doc.roundedRect(30, 190, this.pageWidth - 60, 22, 11, 11, 'FD');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...COLORS.white);
    this.doc.text(this.config.locationName, centerX, 203, { align: 'center' });
    
    // Period badge
    this.doc.setFillColor(255, 255, 255, 0.15);
    this.doc.roundedRect(60, 220, this.pageWidth - 120, 16, 8, 8, 'F');
    
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(255, 255, 255, 0.95);
    this.doc.text(this.config.monthYear, centerX, 230, { align: 'center' });
    
    // Footer information section
    const footerY = this.pageHeight - 35;
    
    // Generated date with icon-style bullet
    this.doc.setFontSize(9);
    this.doc.setTextColor(255, 255, 255, 0.7);
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    this.doc.text(`● Generated: ${today}`, centerX, footerY, { align: 'center' });
    
    // Confidentiality notice
    this.doc.setFontSize(8);
    this.doc.setTextColor(255, 255, 255, 0.6);
    this.doc.text('CONFIDENTIAL & PROPRIETARY', centerX, footerY + 8, { align: 'center' });
    this.doc.text('For Internal Use Only', centerX, footerY + 14, { align: 'center' });
    
    // Premium bottom border
    this.doc.setDrawColor(255, 255, 255, 0.3);
    this.doc.setLineWidth(0.5);
    this.doc.line(20, footerY + 18, this.pageWidth - 20, footerY + 18);
  }

  // ==================== PREMIUM EXECUTIVE SUMMARY ====================
  private addExecutiveSummary() {
    this.addSectionHeader('Executive Summary', '📊');

    const data = this.locationData;
    
    // Calculate comprehensive metrics
    const totalRevenue = data.sales.reduce((sum, s) => sum + (s.paymentValue || 0), 0);
    const totalTransactions = new Set(data.sales.map(s => s.paymentTransactionId)).size;
    const totalMembers = new Set(data.sales.map(s => s.memberId)).size;
    const totalSessions = data.sessions.length;
    const totalAttendees = data.sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
    const totalCapacity = data.sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const avgFillRate = (totalAttendees / (totalCapacity || 1)) * 100;
    const newClients = data.newClients.length;
    const convertedClients = data.newClients.filter(c => c.conversionStatus === 'Converted').length;
    const conversionRate = (convertedClients / (newClients || 1)) * 100;
    const totalLeads = data.leads.length;
    const totalDiscounts = data.discounts.reduce((sum, d) => sum + (d.discountAmount || 0), 0);

    // Premium metrics table with enhanced styling
    const metricsData = [
      ['💰 Total Revenue', formatCurrency(totalRevenue)],
      ['🔢 Total Transactions', formatNumber(totalTransactions)],
      ['👥 Unique Members', formatNumber(totalMembers)],
      ['📅 Total Sessions', formatNumber(totalSessions)],
      ['✓ Class Attendees', formatNumber(totalAttendees)],
      ['📊 Avg Fill Rate', formatPercentage(avgFillRate / 100)],
      ['🆕 New Clients', formatNumber(newClients)],
      ['🎯 Conversion Rate', formatPercentage(conversionRate / 100)],
      ['📍 Total Leads', formatNumber(totalLeads)],
      ['🏷️ Total Discounts', formatCurrency(totalDiscounts)]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Key Performance Indicator', 'Value']],
      body: metricsData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.brandPrimary,
        textColor: COLORS.white,
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 5
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4,
        lineWidth: 0.1,
        lineColor: COLORS.veryLight
      },
      columnStyles: {
        0: { 
          cellWidth: 100, 
          fontStyle: 'bold', 
          textColor: COLORS.mediumDark,
          fillColor: COLORS.background
        },
        1: { 
          cellWidth: 75, 
          halign: 'right', 
          fontStyle: 'bold', 
          textColor: COLORS.brandPrimary,
          fontSize: 11
        }
      },
      alternateRowStyles: {
        fillColor: COLORS.white
      },
      margin: { left: this.margin, right: this.margin },
      didDrawCell: (data) => {
        // Add subtle borders
        if (data.section === 'body') {
          this.doc.setDrawColor(...COLORS.veryLight);
        }
      }
    });

    this.updateCurrentY();
    this.currentY += 5;

    // Premium performance highlights
    const highlights = [
      `Generated ${formatCurrency(totalRevenue)} in gross revenue from ${formatNumber(totalTransactions)} transactions`,
      `Served ${formatNumber(totalAttendees)} attendees across ${formatNumber(totalSessions)} sessions with ${formatPercentage(avgFillRate / 100)} fill rate`,
      `Acquired ${formatNumber(newClients)} new clients with strong ${formatPercentage(conversionRate / 100)} conversion rate`,
      `Processed ${formatNumber(totalLeads)} leads through the sales funnel`,
      `Applied ${formatCurrency(totalDiscounts)} in promotional discounts across ${formatNumber(data.discounts.length)} transactions`
    ];

    this.addInsightBox(
      'Performance Highlights',
      highlights,
      COLORS.success
    );
  }

  // ==================== PREMIUM SALES ANALYTICS ====================
  private addSalesAnalytics() {
    this.addSectionHeader('Sales Analytics', '💰');

    const sales = this.locationData.sales;
    
    // Core metrics
    const totalRevenue = sales.reduce((sum, s) => sum + (s.paymentValue || 0), 0);
    const uniqueTransactions = new Set(sales.map(s => s.paymentTransactionId)).size;
    const uniqueMembers = new Set(sales.map(s => s.memberId)).size;
    const avgTransactionValue = totalRevenue / (uniqueTransactions || 1);
    const avgRevenuePerMember = totalRevenue / (uniqueMembers || 1);
    const totalVAT = sales.reduce((sum, s) => sum + (s.paymentVAT || 0), 0);
    const netRevenue = totalRevenue - totalVAT;

    // Premium sales summary table
    const summaryData = [
      ['Gross Revenue', formatCurrency(totalRevenue)],
      ['VAT Collected', formatCurrency(totalVAT)],
      ['Net Revenue', formatCurrency(netRevenue)],
      ['Total Transactions', formatNumber(uniqueTransactions)],
      ['Unique Members', formatNumber(uniqueMembers)],
      ['Avg Transaction Value', formatCurrency(avgTransactionValue)],
      ['Revenue per Member', formatCurrency(avgRevenuePerMember)]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Sales Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.brandSecondary,
        textColor: COLORS.white,
        fontSize: 11,
        fontStyle: 'bold',
        cellPadding: 5
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { 
          cellWidth: 110, 
          fontStyle: 'bold',
          textColor: COLORS.mediumDark
        },
        1: { 
          cellWidth: 65, 
          halign: 'right', 
          textColor: COLORS.brandSecondary, 
          fontStyle: 'bold',
          fontSize: 11
        }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] as [number, number, number]
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
    this.currentY += 8;

    // Top products with premium styling
    const productRevenue = sales.reduce((acc, sale) => {
      const product = sale.cleanedProduct || 'Unknown Product';
      acc[product] = (acc[product] || 0) + (sale.paymentValue || 0);
      return acc;
    }, {} as Record<string, number>);

    const topProducts = Object.entries(productRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([product, revenue], idx) => [
        `${idx + 1}`,
        product,
        formatCurrency(revenue),
        formatPercentage(revenue / totalRevenue)
      ]);

    if (this.checkPageBreak(90)) this.addNewPage();

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...COLORS.mediumDark);
    this.doc.text('Top 10 Products by Revenue', this.margin, this.currentY);
    this.currentY += 7;

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Product Name', 'Revenue', '% Share']],
      body: topProducts,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.success,
        textColor: COLORS.white,
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { 
          cellWidth: 12, 
          halign: 'center', 
          fontStyle: 'bold',
          fillColor: COLORS.background
        },
        1: { cellWidth: 90 },
        2: { 
          cellWidth: 42, 
          halign: 'right', 
          fontStyle: 'bold',
          textColor: COLORS.success
        },
        3: { 
          cellWidth: 31, 
          halign: 'right',
          textColor: COLORS.medium
        }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] as [number, number, number]
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
    this.currentY += 6;

    // Payment methods
    const paymentMethods = sales.reduce((acc, sale) => {
      const method = sale.paymentMethod || 'Unknown';
      if (!acc[method]) {
        acc[method] = { count: 0, revenue: 0 };
      }
      acc[method].count++;
      acc[method].revenue += sale.paymentValue || 0;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    const paymentData = Object.entries(paymentMethods)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([method, data]) => [
        method,
        formatNumber(data.count),
        formatCurrency(data.revenue),
        formatPercentage(data.revenue / totalRevenue)
      ]);

    if (this.checkPageBreak(65)) this.addNewPage();

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...COLORS.mediumDark);
    this.doc.text('Payment Methods Breakdown', this.margin, this.currentY);
    this.currentY += 7;

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Payment Method', 'Transactions', 'Revenue', '% Share']],
      body: paymentData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.warning,
        textColor: COLORS.white,
        fontSize: 10,
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'right' },
        2: { 
          cellWidth: 40, 
          halign: 'right', 
          fontStyle: 'bold',
          textColor: COLORS.warning
        },
        3: { 
          cellWidth: 30, 
          halign: 'right',
          textColor: COLORS.medium
        }
      },
      alternateRowStyles: {
        fillColor: [254, 252, 232] as [number, number, number]
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
  }

  // ==================== FUNNEL & LEADS ====================
  private addFunnelAndLeads() {
    this.addSectionHeader('Funnel & Leads Analysis', '🎯');

    const leads = this.locationData.leads;
    const newClients = this.locationData.newClients;

    // Calculate funnel metrics
    const totalLeads = leads.length;
    const trialBookings = leads.filter(l => 
      l.status?.toLowerCase().includes('trial') || 
      (l as any).trialBooked === 'Yes'
    ).length;
    const attended = leads.filter(l => (l as any).attended === 'Yes').length;
    const converted = leads.filter(l => l.conversionStatus === 'Converted').length;
    
    const trialBookingRate = (trialBookings / (totalLeads || 1)) * 100;
    const attendanceRate = (attended / (trialBookings || 1)) * 100;
    const conversionRate = (converted / (totalLeads || 1)) * 100;

    // Funnel metrics
    const funnelData = [
      ['Total Leads Generated', formatNumber(totalLeads), '100%'],
      ['Trial Bookings', formatNumber(trialBookings), formatPercentage(trialBookingRate / 100)],
      ['Trials Attended', formatNumber(attended), formatPercentage(attendanceRate / 100)],
      ['Converted to Members', formatNumber(converted), formatPercentage(conversionRate / 100)]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Funnel Stage', 'Count', 'Conversion Rate']],
      body: funnelData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.brandPrimary,
        textColor: COLORS.white,
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
  1: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: COLORS.brandPrimary },
        2: { cellWidth: 35, halign: 'right', textColor: COLORS.success }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
    this.currentY += 8;

    // Lead source analysis
    const leadSources = leads.reduce((acc, lead) => {
      const source = lead.source || 'Unknown';
      if (!acc[source]) {
        acc[source] = { count: 0, converted: 0 };
      }
      acc[source].count++;
      if (lead.conversionStatus === 'Converted') {
        acc[source].converted++;
      }
      return acc;
    }, {} as Record<string, { count: number; converted: number }>);

    const sourceData = Object.entries(leadSources)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([source, data]) => [
        source,
        formatNumber(data.count),
        formatNumber(data.converted),
        formatPercentage(data.converted / data.count)
      ]);

    if (this.checkPageBreak(60)) this.addNewPage();

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...COLORS.dark);
    this.doc.text('Lead Sources Performance', this.margin, this.currentY);
    this.currentY += 7;

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Source', 'Leads', 'Converted', 'Conv. Rate']],
      body: sourceData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.brandSecondary,
        textColor: COLORS.white,
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: COLORS.success }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
    this.currentY += 5;

    // Insights
    this.addInsightBox(
      'Funnel Insights',
      [
        `${formatPercentage(trialBookingRate / 100)} of leads book trial classes`,
        `${formatPercentage(attendanceRate / 100)} trial attendance rate`,
        `${formatPercentage(conversionRate / 100)} overall conversion rate from lead to member`,
        `Top source: ${Object.entries(leadSources).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'N/A'}`,
        `${formatNumber(totalLeads - converted)} leads still in the pipeline`
      ],
      COLORS.success
    );
  }

  // ==================== CLIENT RETENTION & CONVERSION ====================
  private addClientRetentionConversion() {
    this.addSectionHeader('Client Retention & Conversion', '🔄');
    const newClients = this.locationData.newClients;
    
    const totalNew = newClients.length;
    const converted = newClients.filter(c => c.conversionStatus === 'Converted').length;
    const retained = newClients.filter(c => c.retentionStatus === 'Retained').length;
    const avgLTV = newClients.reduce((sum, c) => sum + (c.ltv || 0), 0) / (totalNew || 1);
    const avgVisitsPostTrial = newClients.reduce((sum, c) => sum + (c.visitsPostTrial || 0), 0) / (totalNew || 1);

    const metricsData = [
      ['New Clients Acquired', formatNumber(totalNew)],
      ['Converted Clients', formatNumber(converted)],
      ['Conversion Rate', formatPercentage(converted / (totalNew || 1))],
      ['Retained Clients', formatNumber(retained)],
      ['Retention Rate', formatPercentage(retained / (totalNew || 1))],
      ['Average LTV', formatCurrency(avgLTV)],
      ['Avg Visits Post-Trial', avgVisitsPostTrial.toFixed(1)]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.success, textColor: COLORS.white, fontSize: 11 },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: 'bold' },
  1: { cellWidth: 65, halign: 'right', fontStyle: 'bold', textColor: COLORS.brandPrimary }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
    this.currentY += 5;

    this.addInsightBox(
      'Retention & Conversion Insights',
      [
        `${formatPercentage(converted / (totalNew || 1))} of new clients converted to members`,
        `${formatPercentage(retained / (totalNew || 1))} retention rate`,
        `Average lifetime value: ${formatCurrency(avgLTV)}`,
        `New clients average ${avgVisitsPostTrial.toFixed(1)} visits after trial`
      ],
      COLORS.success
    );
  }

  // ==================== CLASS ATTENDANCE ====================
  private addClassAttendance() {
    this.addSectionHeader('Class Attendance Analytics', '📅');
    const sessions = this.locationData.sessions;
    
    const totalSessions = sessions.length;
    const totalAttendees = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
    const totalCapacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const avgFillRate = (totalAttendees / (totalCapacity || 1)) * 100;
    const lateCancellations = sessions.reduce((sum, s) => sum + (s.lateCancelledCount || 0), 0);
    const avgRevenuePerSession = sessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0) / (totalSessions || 1);

    const summaryData = [
      ['Total Sessions Held', formatNumber(totalSessions)],
      ['Total Attendees', formatNumber(totalAttendees)],
      ['Total Capacity', formatNumber(totalCapacity)],
      ['Average Fill Rate', formatPercentage(avgFillRate / 100)],
      ['Late Cancellations', formatNumber(lateCancellations)],
      ['Avg Revenue/Session', formatCurrency(avgRevenuePerSession)]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.danger, textColor: COLORS.white, fontSize: 11 },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: 'bold' },
  1: { cellWidth: 65, halign: 'right', fontStyle: 'bold', textColor: COLORS.brandPrimary }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
    this.currentY += 10;

    // Top classes
    const classStats = sessions.reduce((acc, session) => {
      const className = session.cleanedClass || session.classType || 'Unknown';
      if (!acc[className]) {
        acc[className] = { sessions: 0, attendees: 0, revenue: 0 };
      }
      acc[className].sessions++;
      acc[className].attendees += session.checkedInCount || 0;
      acc[className].revenue += session.totalPaid || 0;
      return acc;
    }, {} as Record<string, { sessions: number; attendees: number; revenue: number }>);

    const topClasses = Object.entries(classStats)
      .sort((a, b) => b[1].attendees - a[1].attendees)
      .slice(0, 10)
      .map(([className, data], idx) => [
        `${idx + 1}`,
        className,
        formatNumber(data.sessions),
        formatNumber(data.attendees),
        formatPercentage(data.attendees / (data.sessions * 15))
      ]);

    if (this.checkPageBreak(70)) this.addNewPage();

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...COLORS.dark);
    this.doc.text('Top 10 Classes by Attendance', this.margin, this.currentY);
    this.currentY += 7;

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Class Type', 'Sessions', 'Attendees', 'Avg Fill']],
      body: topClasses,
      theme: 'grid',
      headStyles: { fillColor: COLORS.danger, textColor: COLORS.white, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 80 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 28, halign: 'right', textColor: COLORS.success }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
  }

  // ==================== LATE CANCELLATIONS ====================
  private addLateCancellations() {
    this.addSectionHeader('Late Cancellations Analysis', '❌');
    const cancellations = this.locationData.lateCancellations || [];
    
    const totalCancellations = cancellations.length;
    const revenueImpact = cancellations.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const uniqueMembers = new Set(cancellations.map(c => c.memberId)).size;

    const metricsData = [
      ['Total Late Cancellations', formatNumber(totalCancellations)],
      ['Unique Members', formatNumber(uniqueMembers)],
      ['Revenue Impact', formatCurrency(revenueImpact)],
      ['Avg per Cancellation', formatCurrency(revenueImpact / (totalCancellations || 1))]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.danger, textColor: COLORS.white, fontSize: 11 },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: 'bold' },
        1: { cellWidth: 65, halign: 'right', fontStyle: 'bold', textColor: COLORS.danger }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
  }

  // ==================== DISCOUNTS & PROMOTIONS ====================
  private addDiscountsPromotions() {
    this.addSectionHeader('Discounts & Promotions', '🏷️');
    const discounts = this.locationData.discounts;
    
    const totalDiscounted = discounts.length;
    const totalDiscountAmount = discounts.reduce((sum, d) => sum + (d.discountAmount || 0), 0);
    const avgDiscount = discounts.reduce((sum, d) => sum + (d.discountPercentage || 0), 0) / (totalDiscounted || 1);
    const totalRevenue = discounts.reduce((sum, d) => sum + (d.paymentValue || 0), 0);

    const metricsData = [
      ['Discounted Transactions', formatNumber(totalDiscounted)],
      ['Total Discount Amount', formatCurrency(totalDiscountAmount)],
      ['Avg Discount %', formatPercentage(avgDiscount / 100)],
      ['Revenue (with discounts)', formatCurrency(totalRevenue)]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.warning, textColor: COLORS.white, fontSize: 11 },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: 'bold' },
        1: { cellWidth: 65, halign: 'right', fontStyle: 'bold', textColor: COLORS.brandPrimary }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
  }

  // ==================== EXPIRATIONS ====================
  private addExpirations() {
    this.addSectionHeader('Membership Expirations', '⏰');
    const expirations = this.locationData.expirations || [];
    
    const totalExpirations = expirations.length;
    const frozen = expirations.filter(e => e.frozen).length;
    const active = expirations.filter(e => e.status === 'Active').length;

    const metricsData = [
      ['Total Expirations', formatNumber(totalExpirations)],
      ['Frozen Memberships', formatNumber(frozen)],
      ['Still Active', formatNumber(active)]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.warning, textColor: COLORS.white, fontSize: 11 },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: 'bold' },
        1: { cellWidth: 65, halign: 'right', fontStyle: 'bold', textColor: COLORS.brandPrimary }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
  }

  // ==================== POWERCYCLE VS BARRE VS STRENGTH ====================
  private addPowerCycleBarreStrength() {
    this.addSectionHeader('PowerCycle vs Barre vs Strength', '⚡');
    const payroll = this.locationData.payroll;
    
    const cycle = {
      sessions: payroll.reduce((sum, p) => sum + (p.cycleSessions || 0), 0),
      customers: payroll.reduce((sum, p) => sum + (p.cycleCustomers || 0), 0),
      revenue: payroll.reduce((sum, p) => sum + (p.cyclePaid || 0), 0)
    };

    const barre = {
      sessions: payroll.reduce((sum, p) => sum + (p.barreSessions || 0), 0),
      customers: payroll.reduce((sum, p) => sum + (p.barreCustomers || 0), 0),
      revenue: payroll.reduce((sum, p) => sum + (p.barrePaid || 0), 0)
    };

    const strength = {
      sessions: payroll.reduce((sum, p) => sum + (p.strengthSessions || 0), 0),
      customers: payroll.reduce((sum, p) => sum + (p.strengthCustomers || 0), 0),
      revenue: payroll.reduce((sum, p) => sum + (p.strengthPaid || 0), 0)
    };

    const comparisonData = [
      ['Sessions', formatNumber(cycle.sessions), formatNumber(barre.sessions), formatNumber(strength.sessions)],
      ['Customers', formatNumber(cycle.customers), formatNumber(barre.customers), formatNumber(strength.customers)],
      ['Revenue', formatCurrency(cycle.revenue), formatCurrency(barre.revenue), formatCurrency(strength.revenue)],
      ['Avg/Session', 
        formatCurrency(cycle.revenue / (cycle.sessions || 1)),
        formatCurrency(barre.revenue / (barre.sessions || 1)),
        formatCurrency(strength.revenue / (strength.sessions || 1))
      ]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Metric', 'PowerCycle', 'Barre', 'Strength']],
      body: comparisonData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.brandSecondary, textColor: COLORS.white, fontSize: 11 },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'right', textColor: COLORS.brandPrimary },
        2: { cellWidth: 42, halign: 'right', textColor: COLORS.brandSecondary },
        3: { cellWidth: 43, halign: 'right', textColor: COLORS.success }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
  }

  // ==================== TRAINER PERFORMANCE ====================
  private addTrainerPerformance() {
    this.addSectionHeader('Trainer Performance', '👨‍🏫');
    const payroll = this.locationData.payroll;
    
    const topTrainers = payroll
      .sort((a, b) => (b.totalSessions || 0) - (a.totalSessions || 0))
      .slice(0, 10)
      .map((trainer, idx) => [
        `${idx + 1}`,
        trainer.teacherName,
        formatNumber(trainer.totalSessions || 0),
        formatNumber(trainer.totalCustomers || 0),
        formatCurrency(trainer.totalPaid || 0),
        formatPercentage((trainer.retentionRate || 0) / 100)
      ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Trainer', 'Sessions', 'Customers', 'Revenue', 'Retention']],
      body: topTrainers,
      theme: 'striped',
  headStyles: { fillColor: COLORS.brandSecondary, textColor: COLORS.white, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 60 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 20, halign: 'right', textColor: COLORS.success }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.updateCurrentY();
  }

  // ==================== STRATEGIC RECOMMENDATIONS ====================
  private addStrategicRecommendations() {
    this.addSectionHeader('Strategic Recommendations', '💡');
    
    const recommendations = [
      'Focus marketing on top-performing lead sources to maximize conversion',
      'Implement retention programs for high-value clients to increase LTV',
      'Optimize class schedules based on peak attendance patterns',
      'Review discount strategies to balance promotion effectiveness with profitability',
      'Address late cancellation patterns through policy improvements',
      'Invest in top-performing trainers and replicate their success strategies',
      'Expand popular class formats that show high fill rates',
      'Target inactive leads with re-engagement campaigns'
    ];

    recommendations.forEach((rec, idx) => {
      if (this.checkPageBreak(15)) this.addNewPage();
      
  this.doc.setFillColor(...COLORS.brandSecondary, 0.1);
      this.doc.roundedRect(this.margin, this.currentY - 3, this.pageWidth - 2 * this.margin, 11, 2, 2, 'F');
      
  this.doc.setTextColor(...COLORS.brandSecondary);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.text(`${idx + 1}.`, this.margin + 3, this.currentY + 3);
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...COLORS.dark);
      this.doc.setFontSize(9);
      const lines = this.doc.splitTextToSize(rec, this.pageWidth - 2 * this.margin - 15);
      this.doc.text(lines, this.margin + 10, this.currentY + 3);
      
      this.currentY += 14;
    });
  }

  // ==================== PREMIUM UTILITY METHODS ====================
  
  private addSectionHeader(title: string, emoji: string) {
    if (this.checkPageBreak(25)) this.addNewPage();

    // Section divider line
    this.doc.setDrawColor(...COLORS.veryLight);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY - 2, this.pageWidth - this.margin, this.currentY - 2);
    
    this.currentY += 3;

    // Premium header background with gradient simulation
    const headerHeight = 16;
    
    // Base gradient
    this.doc.setFillColor(...COLORS.brandPrimary);
    this.doc.roundedRect(this.margin, this.currentY - 4, this.pageWidth - 2 * this.margin, headerHeight, 4, 4, 'F');
    
    // Gradient overlay
    this.doc.setFillColor(139, 92, 246, 0.3);
    this.doc.roundedRect(this.margin, this.currentY - 4, (this.pageWidth - 2 * this.margin) / 2, headerHeight, 4, 4, 'F');
    
    // Side accent bar
    this.doc.setFillColor(...COLORS.brandAccent);
    this.doc.roundedRect(this.margin, this.currentY - 4, 4, headerHeight, 2, 2, 'F');

    // Title text with shadow
    this.doc.setFontSize(15);
    this.doc.setFont('helvetica', 'bold');
    
    // Shadow
    this.doc.setTextColor(0, 0, 0, 0.3);
    this.doc.text(`${emoji}  ${title}`, this.margin + 9, this.currentY + 5.5);
    
    // Main text
    this.doc.setTextColor(...COLORS.white);
    this.doc.text(`${emoji}  ${title}`, this.margin + 8, this.currentY + 5);

    this.currentY += 20;
  }

  private addInsightBox(title: string, insights: string[], color: [number, number, number]) {
    const boxPadding = 5;
    const lineHeight = 7;
    const boxHeight = insights.length * lineHeight + 18;
    
    if (this.checkPageBreak(boxHeight + 10)) this.addNewPage();

    // Premium box with shadow effect
    // Shadow
    this.doc.setFillColor(0, 0, 0, 0.1);
    this.doc.roundedRect(this.margin + 1, this.currentY + 1, this.pageWidth - 2 * this.margin, boxHeight, 6, 6, 'F');
    
    // Main box background
    this.doc.setFillColor(color[0], color[1], color[2], 0.08);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 6, 6, 'F');

    // Left accent bar
    this.doc.setFillColor(...color);
    this.doc.roundedRect(this.margin + 2, this.currentY + 3, 3, boxHeight - 6, 1.5, 1.5, 'F');

    // Premium border
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(1);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 6, 6);

    // Title section with background
    this.doc.setFillColor(color[0], color[1], color[2], 0.15);
    this.doc.roundedRect(this.margin + 2, this.currentY + 2, this.pageWidth - 2 * this.margin - 4, 10, 3, 3, 'F');
    
    // Title text
    this.doc.setTextColor(...color);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`● ${title}`, this.margin + boxPadding + 3, this.currentY + 8.5);

    // Insights with premium styling
    this.doc.setTextColor(...COLORS.mediumDark);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    
    insights.forEach((insight, idx) => {
      const y = this.currentY + 18 + (idx * lineHeight);
      
      // Bullet point
      this.doc.setFillColor(...color);
      this.doc.circle(this.margin + boxPadding + 4, y - 1.5, 1, 'F');
      
      // Insight text with proper wrapping
      const maxWidth = this.pageWidth - 2 * this.margin - 2 * boxPadding - 10;
      const lines = this.doc.splitTextToSize(insight, maxWidth);
      this.doc.text(lines[0], this.margin + boxPadding + 8, y);
    });

    this.currentY += boxHeight + 10;
  }

  private addMetricCard(label: string, value: string, icon: string, color: [number, number, number]) {
    const cardWidth = (this.pageWidth - 2 * this.margin - 10) / 2;
    const cardHeight = 18;
    const startX = this.margin + ((this.currentY % 2) * (cardWidth + 5));
    
    // Card shadow
    this.doc.setFillColor(0, 0, 0, 0.08);
    this.doc.roundedRect(startX + 0.5, this.currentY + 0.5, cardWidth, cardHeight, 4, 4, 'F');
    
    // Card background
    this.doc.setFillColor(...COLORS.white);
    this.doc.roundedRect(startX, this.currentY, cardWidth, cardHeight, 4, 4, 'F');
    
    // Card border
    this.doc.setDrawColor(...COLORS.veryLight);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(startX, this.currentY, cardWidth, cardHeight, 4, 4);
    
    // Colored accent bar
    this.doc.setFillColor(...color);
    this.doc.roundedRect(startX + 2, this.currentY + 2, 3, cardHeight - 4, 1.5, 1.5, 'F');
    
    // Icon and label
    this.doc.setFontSize(16);
    this.doc.text(icon, startX + 8, this.currentY + 9);
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.medium);
    this.doc.text(label, startX + 16, this.currentY + 8);
    
    // Value
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...color);
    this.doc.text(value, startX + 16, this.currentY + 15);
  }

  private checkPageBreak(requiredSpace: number): boolean {
    return this.currentY + requiredSpace > this.pageHeight - 25;
  }

  private addNewPage() {
    this.doc.addPage();
    this.currentY = 25;
    this.pageNumber++;
    this.addPageHeader();
    this.addPageFooter();
  }

  private addPageHeader() {
    // Premium header background
    this.doc.setFillColor(...COLORS.background);
    this.doc.rect(0, 0, this.pageWidth, 15, 'F');
    
    // Gradient accent line
    const gradientHeight = 2;
    for (let i = 0; i < 10; i++) {
      const ratio = i / 10;
      const r = COLORS.brandPrimary[0] + ratio * (COLORS.brandSecondary[0] - COLORS.brandPrimary[0]);
      const g = COLORS.brandPrimary[1] + ratio * (COLORS.brandSecondary[1] - COLORS.brandPrimary[1]);
      const b = COLORS.brandPrimary[2] + ratio * (COLORS.brandSecondary[2] - COLORS.brandPrimary[2]);
      this.doc.setFillColor(r, g, b);
      this.doc.rect((this.pageWidth / 10) * i, 0, this.pageWidth / 10, gradientHeight, 'F');
    }
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...COLORS.brandPrimary);
    this.doc.text('PHYSIQUE 57', this.margin, 9);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.medium);
    this.doc.text('Executive Report', this.margin + 25, 9);
    
    // Right side info
    this.doc.setFontSize(7);
    this.doc.setTextColor(...COLORS.light);
    this.doc.text(`${this.config.locationName} | ${this.config.monthYear}`, this.pageWidth - this.margin, 9, { align: 'right' });
    
    // Bottom border
    this.doc.setDrawColor(...COLORS.veryLight);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, 13, this.pageWidth - this.margin, 13);
  }

  private addPageFooter() {
    const y = this.pageHeight - 12;
    
    // Top border with gradient
    this.doc.setDrawColor(...COLORS.veryLight);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, y - 5, this.pageWidth - this.margin, y - 5);
    
    // Footer content
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.light);
    this.doc.text('CONFIDENTIAL', this.margin, y);
    
    // Page number in circle
    const pageNumX = this.pageWidth / 2;
    this.doc.setFillColor(...COLORS.brandPrimary);
    this.doc.circle(pageNumX, y - 2, 4, 'F');
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...COLORS.white);
    this.doc.text(`${this.pageNumber}`, pageNumX, y, { align: 'center' });
    
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.light);
    this.doc.text('© 2025 Physique 57', this.pageWidth - this.margin, y, { align: 'right' });
  }

  private updateCurrentY() {
    const lastTable = (this.doc as any).lastAutoTable;
    if (lastTable && lastTable.finalY) {
      this.currentY = lastTable.finalY + 8;
    }
  }
}

/**
 * Generate and download executive reports for all locations
 */
export async function generateLocationReports(
  allData: any,
  locations: string[],
  monthYear: string
): Promise<void> {
  const { start: periodStart, end: periodEnd } = getPreviousMonthDateRange();
  
  for (const location of locations) {
    const config: ReportConfig = {
      locationName: location,
      monthYear: monthYear,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd)
    };

    const generator = new ExecutivePDFReportGenerator(config);
    const blob = await generator.generateReport(allData);
    
    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Executive-Report-${location.replace(/\s+/g, '-').replace(/,/g, '')}-${monthYear.replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Delay between downloads
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}
