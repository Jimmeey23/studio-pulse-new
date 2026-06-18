import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { exportDashboardToPDF } from '@/services/hybridPDFExportService';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

interface ExecutivePDFExportButtonProps {
  dateRange?: {
    start: string;
    end: string;
  };
  location?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  showLabel?: boolean;
}

export const ExecutivePDFExportButton: React.FC<ExecutivePDFExportButtonProps> = ({
  dateRange,
  location,
  className,
  variant = 'default',
  size = 'default',
  showLabel = true,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { filters } = useGlobalFilters();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Use hybrid PDF export service with dashboard HTML capture
      await exportDashboardToPDF(
        'executive-dashboard',
        'Executive Dashboard Report',
        {
          dateRange: dateRange || filters.dateRange,
          location: location ? [location] : filters.location,
        },
        {
          filename: `Executive-Report-${new Date().toISOString().split('T')[0]}.pdf`,
          scale: 2,
          quality: 0.95,
          margin: 10,
        }
      );

      toast({
        title: 'Success',
        description: 'Executive report PDF has been generated and downloaded.',
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate PDF report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
      className={cn(
        'gap-2 transition-all duration-200',
        isExporting && 'opacity-75 cursor-not-allowed',
        className
      )}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {showLabel && <span>Generating...</span>}
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          {showLabel && <span>Download Executive Report</span>}
        </>
      )}
    </Button>
  );
};

export default ExecutivePDFExportButton;
