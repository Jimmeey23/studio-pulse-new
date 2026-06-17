/**
 * Data Export Tool Component
 * Allows users to export all app data in various formats
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  Table as TableIcon,
  TrendingUp,
  Eye,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { crawlAllData, DataSources } from '@/services/dataCrawler';
import { 
  exportToCSV, 
  exportToPDF, 
  exportToText, 
  exportToJSON, 
  exportToExcel,
  ExportFormat 
} from '@/services/exportService';
import { PAGE_REGISTRY, ExtractedData } from '@/services/dataExtraction';

interface DataExportToolProps {
  dataSources: DataSources;
}

export const DataExportTool: React.FC<DataExportToolProps> = ({ dataSources }) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [selectedPages, setSelectedPages] = useState<string[]>(Object.keys(PAGE_REGISTRY));
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up']);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [previewData, setPreviewData] = useState<ExtractedData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const allPages = Object.keys(PAGE_REGISTRY);
  const allLocations = ['All Locations', 'Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'Pop-up'];

  const handlePageToggle = (page: string) => {
    setSelectedPages(prev => 
      prev.includes(page) 
        ? prev.filter(p => p !== page)
        : [...prev, page]
    );
  };

  const handleLocationToggle = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const handleSelectAllPages = () => {
    setSelectedPages(allPages);
  };

  const handleDeselectAllPages = () => {
    setSelectedPages([]);
  };

  const handleSelectAllLocations = () => {
    setSelectedLocations(allLocations);
  };

  const handleDeselectAllLocations = () => {
    setSelectedLocations([]);
  };

  const handleGeneratePreview = async () => {
    if (selectedPages.length === 0) {
      toast({
        title: 'No pages selected',
        description: 'Please select at least one page to export.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedLocations.length === 0) {
      toast({
        title: 'No locations selected',
        description: 'Please select at least one location to export.',
        variant: 'destructive',
      });
      return;
    }

    if (!includeTables && !includeMetrics) {
      toast({
        title: 'Nothing to export',
        description: 'Please select either tables or metrics to export.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      // Crawl all selected data
      const extractedData = await crawlAllData(dataSources, {
        pages: selectedPages,
        locations: selectedLocations,
        includeTables,
        includeMetrics,
      });

      setPreviewData(extractedData);
      setShowPreview(true);

      toast({
        title: 'Preview generated!',
        description: `Found ${extractedData.summary.totalTables} tables and ${extractedData.summary.totalMetrics} metrics.`,
      });
    } catch (error) {
      console.error('Preview generation error:', error);
      toast({
        title: 'Preview failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    if (!previewData) {
      toast({
        title: 'No preview data',
        description: 'Please generate a preview first.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `physique57-analytics-${timestamp}`;

      // Export in selected format
      switch (exportFormat) {
        case 'csv':
          exportToCSV(previewData, filename);
          break;
        case 'pdf':
          exportToPDF(previewData, filename);
          break;
        case 'txt':
          exportToText(previewData, filename);
          break;
        case 'json':
          exportToJSON(previewData, filename);
          break;
        case 'excel':
          exportToExcel(previewData, filename);
          break;
      }

      toast({
        title: 'Export successful!',
        description: `Downloaded ${previewData.summary.totalTables} tables and ${previewData.summary.totalMetrics} metrics as ${exportFormat.toUpperCase()}.`,
      });
      
      setShowPreview(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatIcons: Record<ExportFormat, React.ReactNode> = {
    csv: <FileSpreadsheet className="w-4 h-4" />,
    pdf: <FileText className="w-4 h-4" />,
    txt: <FileText className="w-4 h-4" />,
    json: <FileJson className="w-4 h-4" />,
    excel: <FileSpreadsheet className="w-4 h-4" />,
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <CardTitle className="text-2xl">Data Export Tool</CardTitle>
            <CardDescription>
              Export all tables and metrics from the analytics dashboard
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Export Format Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Export Format</Label>
          <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  {formatIcons.csv}
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                  {formatIcons.excel}
                  Excel
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  {formatIcons.pdf}
                  PDF
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="txt" id="txt" />
                <Label htmlFor="txt" className="flex items-center gap-2 cursor-pointer">
                  {formatIcons.txt}
                  Text
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  {formatIcons.json}
                  JSON
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Content Type Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">What to Export</Label>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="tables" 
                checked={includeTables}
                onCheckedChange={(checked) => setIncludeTables(checked as boolean)}
              />
              <Label htmlFor="tables" className="flex items-center gap-2 cursor-pointer">
                <TableIcon className="w-4 h-4 text-purple-600" />
                Tables
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="metrics" 
                checked={includeMetrics}
                onCheckedChange={(checked) => setIncludeMetrics(checked as boolean)}
              />
              <Label htmlFor="metrics" className="flex items-center gap-2 cursor-pointer">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Metrics
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Page Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Select Pages</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAllPages}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAllPages}>
                Deselect All
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
            {allPages.map(page => (
              <div key={page} className="flex items-center space-x-2">
                <Checkbox
                  id={page}
                  checked={selectedPages.includes(page)}
                  onCheckedChange={() => handlePageToggle(page)}
                />
                <Label htmlFor={page} className="text-sm cursor-pointer">
                  {page}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {selectedPages.length} of {allPages.length} pages selected
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Location Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Select Locations</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAllLocations}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAllLocations}>
                Deselect All
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {allLocations.map(location => (
              <div key={location} className="flex items-center space-x-2">
                <Checkbox
                  id={location}
                  checked={selectedLocations.includes(location)}
                  onCheckedChange={() => handleLocationToggle(location)}
                />
                <Label htmlFor={location} className="text-sm cursor-pointer">
                  {location}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {selectedLocations.length} of {allLocations.length} locations selected
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Preview & Export Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleGeneratePreview}
            disabled={isExporting}
            size="lg"
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Preview...
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 mr-2" />
                Preview Data
              </>
            )}
          </Button>
          
          {selectedPages.length > 0 && selectedLocations.length > 0 && (
            <div className="text-sm text-gray-600 text-center">
              Will preview data from <strong>{selectedPages.length} page(s)</strong> across <strong>{selectedLocations.length} location(s)</strong>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {showPreview && previewData && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Export Preview</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Review your data before exporting
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-auto p-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Total Tables</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {previewData.summary.totalTables}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Total Metrics</div>
                      <div className="text-2xl font-bold text-green-600">
                        {previewData.summary.totalMetrics}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Pages</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {previewData.summary.pages.length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Locations</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {previewData.summary.locations.length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tables Preview */}
                {previewData.tables.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TableIcon className="w-5 h-5 text-blue-600" />
                      Tables ({previewData.tables.length})
                    </h3>
                    <div className="space-y-4">
                      {previewData.tables.slice(0, 5).map((table, idx) => (
                        <Card key={idx} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{table.title}</CardTitle>
                                <div className="flex gap-2 mt-2">
                                  {table.location && (
                                    <Badge variant="outline" className="text-xs">
                                      {table.location}
                                    </Badge>
                                  )}
                                  {table.metadata?.page && (
                                    <Badge variant="secondary" className="text-xs">
                                      {table.metadata.page}
                                    </Badge>
                                  )}
                                  {table.tab && (
                                    <Badge variant="secondary" className="text-xs">
                                      {table.tab}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800">
                                {table.rows.length} rows
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    {table.headers.slice(0, 5).map((header, i) => (
                                      <th key={i} className="px-3 py-2 text-left font-semibold text-gray-700">
                                        {header}
                                      </th>
                                    ))}
                                    {table.headers.length > 5 && (
                                      <th className="px-3 py-2 text-left font-semibold text-gray-500">
                                        +{table.headers.length - 5} more
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {table.rows.slice(0, 3).map((row, rowIdx) => (
                                    <tr key={rowIdx} className="border-t border-gray-100">
                                      {row.slice(0, 5).map((cell, cellIdx) => (
                                        <td key={cellIdx} className="px-3 py-2 text-gray-600">
                                          {String(cell)}
                                        </td>
                                      ))}
                                      {row.length > 5 && (
                                        <td className="px-3 py-2 text-gray-400">...</td>
                                      )}
                                    </tr>
                                  ))}
                                  {table.rows.length > 3 && (
                                    <tr className="border-t border-gray-100">
                                      <td colSpan={Math.min(table.headers.length, 6)} className="px-3 py-2 text-center text-gray-500 italic">
                                        ... {table.rows.length - 3} more rows
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {previewData.tables.length > 5 && (
                        <div className="text-center text-gray-500 py-4 italic">
                          ... and {previewData.tables.length - 5} more tables
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metrics Preview */}
                {previewData.metrics.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Metrics ({previewData.metrics.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {previewData.metrics.slice(0, 10).map((metric, idx) => (
                        <Card key={idx} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-700">
                                  {metric.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {metric.category}
                                </div>
                                {metric.location && (
                                  <Badge variant="outline" className="text-xs mt-2">
                                    {metric.location}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {typeof metric.value === 'number' 
                                    ? metric.value.toLocaleString() 
                                    : metric.value}
                                </div>
                                {metric.change && (
                                  <div className="text-xs text-gray-500">
                                    {metric.change}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {previewData.metrics.length > 10 && (
                      <div className="text-center text-gray-500 py-4 italic">
                        ... and {previewData.metrics.length - 10} more metrics
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t p-6 bg-gray-50">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Export format: <strong className="text-gray-900">{exportFormat.toUpperCase()}</strong>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm text-blue-900">
              <p className="font-semibold">Export Information:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>CSV/Excel: Best for importing into spreadsheet software</li>
                <li>PDF: Formatted report with tables (limited to 100 rows per table)</li>
                <li>Text: Plain text format, easy to read and share</li>
                <li>JSON: Structured data for programmatic use</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
