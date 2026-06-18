import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Hybrid PDF Export Service
 * Combines HTML-to-Canvas capture with jsPDF generation
 * Provides both visual fidelity and programmatic control
 */

interface PDFExportOptions {
  filename?: string;
  scale?: number;
  quality?: number;
  margin?: number;
}

export const exportDashboardToPDF = async (
  elementId: string,
  reportTitle: string,
  filters: {
    dateRange?: { start: string; end: string };
    location?: string[];
  },
  options: PDFExportOptions = {}
): Promise<void> => {
  const {
    filename = 'dashboard-report.pdf',
    scale = 2,
    quality = 0.95,
    margin = 10,
  } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Show loading state
    const originalDisplay = element.style.display;
    element.style.display = 'block';

    // Step 1: Capture dashboard as canvas
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowHeight: element.scrollHeight,
      windowWidth: element.scrollWidth,
    });

    element.style.display = originalDisplay;

    // Step 2: Create PDF from canvas (hybrid approach)
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin;

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/jpeg', quality);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    // Calculate dimensions to fit on page
    let pdfWidth = contentWidth;
    let pdfHeight = pdfWidth / ratio;

    // Step 3: Add header with metadata
    const headerHeight = 25;
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(reportTitle, margin, margin + 8);

    // Add filter information
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    let filterY = margin + 15;
    if (filters.dateRange) {
      pdf.text(
        `Date Range: ${filters.dateRange.start} to ${filters.dateRange.end}`,
        margin,
        filterY
      );
      filterY += 5;
    }
    if (filters.location && filters.location.length > 0) {
      pdf.text(`Locations: ${filters.location.join(', ')}`, margin, filterY);
      filterY += 5;
    }
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, filterY);

    // Add divider line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, margin + headerHeight, pageWidth - margin, margin + headerHeight);

    // Step 4: Add dashboard image(s) to PDF
    let currentY = margin + headerHeight + 5;
    let remainingHeight = imgHeight;
    let imagePosition = 0;

    while (remainingHeight > 0) {
      const canvasSection = document.createElement('canvas');
      const ctx = canvasSection.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      // Determine section height
      const sectionHeight = Math.min(
        imgHeight - imagePosition,
        (contentHeight / imgHeight) * imgHeight
      );
      
      canvasSection.width = imgWidth;
      canvasSection.height = sectionHeight;

      // Draw section of original canvas
      ctx.drawImage(
        canvas,
        0,
        imagePosition,
        imgWidth,
        sectionHeight,
        0,
        0,
        imgWidth,
        sectionHeight
      );

      // Add to PDF
      const sectionImgData = canvasSection.toDataURL('image/jpeg', quality);
      const sectionPdfHeight = (sectionHeight / imgHeight) * pdfHeight;

      if (currentY + sectionPdfHeight > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.addImage(sectionImgData, 'JPEG', margin, currentY, pdfWidth, sectionPdfHeight);
      currentY += sectionPdfHeight + 5;
      imagePosition += sectionHeight;
      remainingHeight -= sectionHeight;
    }

    // Step 5: Add footer on last page
    const pageCount = pdf.getNumberOfPages();
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${pageCount} of ${pageCount}`,
      pageWidth - margin - 20,
      pageHeight - margin + 5
    );

    // Step 6: Download PDF
    pdf.save(filename);
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Alternative: Data-driven PDF with custom styling
 * For more programmatic control over layout
 */
export const generateDataDrivenPDF = async (
  reportData: {
    title: string;
    sections: Array<{
      heading: string;
      content: string | string[];
      data?: Array<{ label: string; value: string }>;
    }>;
    filters: {
      dateRange?: { start: string; end: string };
      location?: string[];
    };
  },
  filename: string = 'data-report.pdf'
): Promise<void> => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(reportData.title, margin, yPosition);
    yPosition += 15;

    // Metadata
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);

    if (reportData.filters.dateRange) {
      pdf.text(
        `Date Range: ${reportData.filters.dateRange.start} to ${reportData.filters.dateRange.end}`,
        margin,
        yPosition
      );
      yPosition += 7;
    }

    if (reportData.filters.location?.length) {
      pdf.text(`Locations: ${reportData.filters.location.join(', ')}`, margin, yPosition);
      yPosition += 7;
    }

    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 10;

    // Divider
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Sections
    pdf.setTextColor(0, 0, 0);
    reportData.sections.forEach((section) => {
      // Check if new page needed
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
      }

      // Section heading
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(section.heading, margin, yPosition);
      yPosition += 10;

      // Section content
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      if (Array.isArray(section.content)) {
        section.content.forEach((line) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin + 5, yPosition);
          yPosition += 6;
        });
      } else {
        const lines = pdf.splitTextToSize(section.content, pageWidth - 2 * margin - 10);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin + 5, yPosition);
          yPosition += 6;
        });
      }

      // Data table if provided
      if (section.data && section.data.length > 0) {
        yPosition += 5;
        section.data.forEach((item) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.setFont('helvetica', 'bold');
          pdf.text(item.label, margin + 10, yPosition);
          pdf.setFont('helvetica', 'normal');
          pdf.text(item.value, pageWidth - margin - 40, yPosition);
          yPosition += 7;
        });
      }

      yPosition += 8;
    });

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      margin,
      pageHeight - margin + 5
    );

    pdf.save(filename);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
