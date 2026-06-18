import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Generate a PDF report for a specific location with screenshots of all dashboard sections
 */
export const generateLocationPDFReport = async (
  location: string,
  onProgress?: (message: string) => void
): Promise<void> => {
  try {
    onProgress?.(`Generating PDF for ${location}...`);
    
    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add title page
    pdf.setFontSize(24);
    pdf.setTextColor(30, 41, 59); // slate-800
    pdf.text('Executive Summary Report', pageWidth / 2, 40, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setTextColor(71, 85, 105); // slate-600
    pdf.text(location, pageWidth / 2, 55, { align: 'center' });
    
    pdf.setFontSize(12);
    const reportDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    pdf.text(reportDate, pageWidth / 2, 70, { align: 'center' });
    
    // Sections to capture (IDs must match the DOM elements)
    const sections = [
      { id: 'executive-metrics', title: 'Key Performance Metrics' },
      { id: 'executive-charts', title: 'Performance Charts' },
      { id: 'executive-tables', title: 'Detailed Data Tables' },
      { id: 'executive-performance', title: 'Top Performers' }
    ];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      onProgress?.(`Capturing ${section.title}...`);
      
      const element = document.getElementById(section.id);
      if (!element) {
        console.warn(`Section not found: ${section.id}`);
        continue;
      }
      
      // Scroll element into view to ensure it's rendered
      element.scrollIntoView({ behavior: 'auto', block: 'center' });
      
      // Wait for any animations or lazy loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capture screenshot
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });
      
      // Add new page for each section (except first)
      if (i > 0 || sections.length > 0) {
        pdf.addPage();
      }
      
      // Add section title
      pdf.setFontSize(18);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text(section.title, margin, margin + 10);
      
      // Calculate image dimensions
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image below title
      let yOffset = margin + 20;
      
      // Handle multi-page sections if content is too tall
      if (imgHeight > pageHeight - yOffset - margin) {
        // Split into multiple pages
        const pagesNeeded = Math.ceil(imgHeight / (pageHeight - yOffset - margin));
        const pageContentHeight = pageHeight - yOffset - margin;
        
        for (let page = 0; page < pagesNeeded; page++) {
          if (page > 0) {
            pdf.addPage();
            yOffset = margin;
          }
          
          const srcY = (page * pageContentHeight * canvas.width) / imgWidth;
          const srcHeight = Math.min(
            (pageContentHeight * canvas.width) / imgWidth,
            canvas.height - srcY
          );
          
          // Create a temporary canvas for this page's slice
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = srcHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            tempCtx.drawImage(
              canvas,
              0, srcY, canvas.width, srcHeight,
              0, 0, canvas.width, srcHeight
            );
            
            const sliceData = tempCanvas.toDataURL('image/png');
            const sliceHeight = (srcHeight * imgWidth) / canvas.width;
            pdf.addImage(sliceData, 'PNG', margin, yOffset, imgWidth, sliceHeight);
          }
        }
      } else {
        // Fits on one page
        pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
      }
    }
    
    // Add footer with page numbers
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }
    
    // Save PDF
    const fileName = `Executive-Report-${location.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    onProgress?.(`PDF generated successfully: ${fileName}`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generate PDF reports for all locations sequentially
 */
export const generateAllLocationReports = async (
  locations: string[],
  updateLocationFilter: (location: string) => void,
  onProgress?: (message: string) => void
): Promise<void> => {
  try {
    onProgress?.(`Starting PDF generation for ${locations.length} locations...`);
    
    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];
      
      // Update location filter
      updateLocationFilter(location);
      
      // Wait for data to load and render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate PDF for this location
      await generateLocationPDFReport(location, onProgress);
      
      // Small delay between reports
      if (i < locations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Reset to "All Locations"
    updateLocationFilter('all');
    
    onProgress?.(`All ${locations.length} location reports generated successfully!`);
  } catch (error) {
    console.error('Error generating all location reports:', error);
    throw error;
  }
};

/**
 * Generate a single comprehensive PDF with all locations
 */
export const generateComprehensivePDFReport = async (
  onProgress?: (message: string) => void
): Promise<void> => {
  try {
    onProgress?.('Generating comprehensive report...');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add cover page
    pdf.setFontSize(28);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Executive Summary', pageWidth / 2, 60, { align: 'center' });
    
    pdf.setFontSize(18);
    pdf.setTextColor(71, 85, 105);
    pdf.text('All Locations Comprehensive Report', pageWidth / 2, 75, { align: 'center' });
    
    pdf.setFontSize(14);
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(reportDate, pageWidth / 2, 90, { align: 'center' });
    
    // Capture main dashboard view
    const mainDashboard = document.getElementById('executive-dashboard-main');
    if (mainDashboard) {
      pdf.addPage();
      
      const canvas = await html2canvas(mainDashboard, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, 270));
    }
    
    // Save
    const fileName = `Executive-Comprehensive-Report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    onProgress?.(`Comprehensive report generated: ${fileName}`);
  } catch (error) {
    console.error('Error generating comprehensive PDF:', error);
    throw error;
  }
};
