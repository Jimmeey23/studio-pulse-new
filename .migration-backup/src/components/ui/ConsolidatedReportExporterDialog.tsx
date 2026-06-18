import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { CONSOLIDATED_ROUTE_OPTIONS, type ConsolidatedReportFormat, generateConsolidatedReport } from '@/services/consolidatedReportService';
import { CONSOLIDATED_STUDIO_OPTIONS, type ConsolidatedStudioId } from '@/utils/consolidatedExportPreset';
import { Download, FileJson, FileText, FileType2, LayoutTemplate, ScrollText } from 'lucide-react';
import { OPEN_CONSOLIDATED_REPORT_EVENT } from '@/components/ui/consolidatedReportEvents';

const today = new Date();
const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

interface ConsolidatedReportExporterDialogProps {
  initialOpen?: boolean;
}

export const ConsolidatedReportExporterDialog: React.FC<ConsolidatedReportExporterDialogProps> = ({
  initialOpen = false,
}) => {
  const [open, setOpen] = React.useState(initialOpen);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [studioId, setStudioId] = React.useState<ConsolidatedStudioId>('kwality');
  const [startDate, setStartDate] = React.useState(currentMonthStart);
  const [endDate, setEndDate] = React.useState(currentMonthEnd);
  const [format, setFormat] = React.useState<ConsolidatedReportFormat>('markdown');
  const [fileNamePrefix, setFileNamePrefix] = React.useState('physique57-consolidated-report');
  const [selectedRoutes, setSelectedRoutes] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(CONSOLIDATED_ROUTE_OPTIONS.map((route) => [route.id, route.defaultSelected !== false])),
  );
  const { toast } = useToast();

  React.useEffect(() => {
    const openDialog = () => setOpen(true);
    window.addEventListener(OPEN_CONSOLIDATED_REPORT_EVENT, openDialog);
    return () => window.removeEventListener(OPEN_CONSOLIDATED_REPORT_EVENT, openDialog);
  }, []);

  const activeRouteCount = React.useMemo(
    () => Object.values(selectedRoutes).filter(Boolean).length,
    [selectedRoutes],
  );

  const toggleRoute = (routeId: string) => {
    setSelectedRoutes((previous) => ({
      ...previous,
      [routeId]: !previous[routeId],
    }));
  };

  const openAllRoutes = () => {
    setSelectedRoutes(Object.fromEntries(CONSOLIDATED_ROUTE_OPTIONS.map((route) => [route.id, true])));
  };

  const clearAllRoutes = () => {
    setSelectedRoutes(Object.fromEntries(CONSOLIDATED_ROUTE_OPTIONS.map((route) => [route.id, false])));
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Date range required',
        description: 'Please choose both a start and end date for the consolidated report.',
        variant: 'destructive',
      });
      return;
    }

    if (activeRouteCount === 0) {
      toast({
        title: 'No tabs selected',
        description: 'Pick at least one analytics tab to include in the consolidated report.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const routes = CONSOLIDATED_ROUTE_OPTIONS.filter((route) => selectedRoutes[route.id]);
      await generateConsolidatedReport({
        preset: { studioId, startDate, endDate },
        routes,
        format,
        fileNamePrefix,
      });
      toast({
        title: 'Consolidated report ready',
        description: `Downloaded a structured ${format.toUpperCase()} document covering ${routes.length} analytics tabs.`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Consolidated export failed',
        description: error instanceof Error ? error.message : 'The consolidated report could not be generated.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            Consolidated Table Report
          </DialogTitle>
          <DialogDescription>
            Generate one structured document by crawling the selected analytics routes, applying the requested studio and period, and combining all visible table data into a single export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="consolidated-studio">Studio</Label>
              <select
                id="consolidated-studio"
                value={studioId}
                onChange={(event) => setStudioId(event.target.value as ConsolidatedStudioId)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CONSOLIDATED_STUDIO_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="consolidated-start-date">Start date</Label>
              <Input id="consolidated-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consolidated-end-date">End date</Label>
              <Input id="consolidated-end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consolidated-format">Output format</Label>
              <select
                id="consolidated-format"
                value={format}
                onChange={(event) => setFormat(event.target.value as ConsolidatedReportFormat)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="markdown">Markdown (.md)</option>
                <option value="html">HTML document (.html)</option>
                <option value="txt">Plain text (.txt)</option>
                <option value="json">JSON bundle (.json)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="consolidated-filename">File name prefix</Label>
            <Input id="consolidated-filename" value={fileNamePrefix} onChange={(event) => setFileNamePrefix(event.target.value)} />
          </div>

          <div className="rounded-lg border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-slate-900">Routes to include</div>
                <div className="text-sm text-slate-600">Each selected route is loaded off-screen and all visible tables across its internal tabs are collected into the final document.</div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={openAllRoutes}>Select all</Button>
                <Button type="button" variant="outline" size="sm" onClick={clearAllRoutes}>Clear all</Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {CONSOLIDATED_ROUTE_OPTIONS.map((route) => (
                <label key={route.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                  <Checkbox checked={Boolean(selectedRoutes[route.id])} onCheckedChange={() => toggleRoute(route.id)} />
                  <span className="text-sm text-slate-800">{route.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <div className="font-medium mb-2 flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Export summary
            </div>
            <ul className="space-y-1 text-blue-800">
              <li>Studio preset: <span className="font-medium">{CONSOLIDATED_STUDIO_OPTIONS.find((option) => option.id === studioId)?.label}</span></li>
              <li>Period: <span className="font-medium">{startDate} to {endDate}</span></li>
              <li>Routes included: <span className="font-medium">{activeRouteCount}</span></li>
              <li>Format: <span className="font-medium">{format.toUpperCase()}</span></li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <>
                  <BrandSpinner size="xs" />
                  Generating...
                </>
              ) : (
                <>
                  {format === 'markdown' ? <FileText className="h-4 w-4" /> : null}
                  {format === 'html' ? <FileType2 className="h-4 w-4" /> : null}
                  {format === 'json' ? <FileJson className="h-4 w-4" /> : null}
                  {format === 'txt' ? <ScrollText className="h-4 w-4" /> : null}
                  <Download className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsolidatedReportExporterDialog;
