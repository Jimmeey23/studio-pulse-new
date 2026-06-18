import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { OverviewDataBundle, OverviewFiltersShape } from './types';
import { exportDashboardOverviewPDFReports } from '@/services/dashboardOverviewPDFService';

interface OverviewPDFExportButtonProps {
  data: OverviewDataBundle;
  filters: OverviewFiltersShape;
}

export const OverviewPDFExportButton: React.FC<OverviewPDFExportButtonProps> = ({ data, filters }) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportDashboardOverviewPDFReports({
        data,
        filters,
        selectedLocations: filters.location,
      });

      toast({
        title: 'Overview reports generated',
        description: filters.location.length
          ? 'The selected location report has been downloaded.'
          : 'Separate location reports have been downloaded.',
      });
    } catch (error) {
      console.error('Overview PDF export failed:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to generate the overview reports.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isExporting}
      onClick={handleExport}
      className="gap-2"
    >
      {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      <span>{isExporting ? 'Generating...' : 'Export PDF Report'}</span>
    </Button>
  );
};

export default OverviewPDFExportButton;
