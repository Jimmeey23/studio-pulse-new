import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  Table, 
  FileSpreadsheet, 
  Image, 
  Loader2,
  Settings,
  Filter,
  Calendar,
  Database
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

export interface ExportColumn {
  key: string;
  header: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'boolean';
  formatter?: (value: any) => string;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  includeHeaders: boolean;
  selectedColumns: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  maxRows?: number;
}

interface EnhancedDataExportProps {
  data: any[];
  columns: ExportColumn[];
  filename?: string;
  title?: string;
  onExport?: (data: any[], options: ExportOptions) => void;
}

export const EnhancedDataExport: React.FC<EnhancedDataExportProps> = ({
  data,
  columns,
  filename = 'data',
  title = 'Export Data',
  onExport
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeHeaders: true,
    selectedColumns: columns.map(col => col.key),
    maxRows: 10000
  });

  const { toast } = useToast();

  // Filter and process data based on options
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply date range filter if specified
    if (exportOptions.dateRange && exportOptions.dateRange.start && exportOptions.dateRange.end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date || item.paymentDate || item.createdAt);
        return itemDate >= exportOptions.dateRange!.start && itemDate <= exportOptions.dateRange!.end;
      });
    }

    // Apply custom filters
    if (exportOptions.filters) {
      filtered = filtered.filter(item => {
        return Object.entries(exportOptions.filters!).every(([key, value]) => {
          if (!value) return true;
          const itemValue = String(item[key] || '').toLowerCase();
          const filterValue = String(value).toLowerCase();
          return itemValue.includes(filterValue);
        });
      });
    }

    // Sort data
    if (exportOptions.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[exportOptions.sortBy!];
        const bValue = b[exportOptions.sortBy!];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return exportOptions.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        }
        
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (exportOptions.sortOrder === 'desc') {
          return bStr.localeCompare(aStr);
        }
        return aStr.localeCompare(bStr);
      });
    }

    // Limit rows
    if (exportOptions.maxRows && filtered.length > exportOptions.maxRows) {
      filtered = filtered.slice(0, exportOptions.maxRows);
    }

    return filtered;
  }, [data, exportOptions]);

  // Format cell value based on column type
  const formatCellValue = useCallback((value: any, column: ExportColumn): string => {
    if (value === null || value === undefined) return '';
    
    if (column.formatter) {
      return column.formatter(value);
    }

    switch (column.type) {
      case 'currency':
        return formatCurrency(Number(value));
      case 'number':
        return formatNumber(Number(value));
      case 'date':
        return formatDate(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  }, []);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const selectedCols = columns.filter(col => exportOptions.selectedColumns.includes(col.key));
    
    const headers = selectedCols.map(col => col.header);
    const csvContent = [
      exportOptions.includeHeaders ? headers.join(',') : '',
      ...processedData.map(row => 
        selectedCols.map(col => {
          const value = formatCellValue(row[col.key], col);
          // Escape commas and quotes
          return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ].filter(Boolean).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `${filename}.csv`);
  }, [processedData, exportOptions, columns, filename, formatCellValue]);

  // Export to JSON
  const exportToJSON = useCallback(() => {
    const selectedCols = columns.filter(col => exportOptions.selectedColumns.includes(col.key));
    
    const jsonData = processedData.map(row => {
      const filteredRow: any = {};
      selectedCols.forEach(col => {
        filteredRow[col.key] = row[col.key];
      });
      return filteredRow;
    });

    const jsonContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadFile(blob, `${filename}.json`);
  }, [processedData, exportOptions, columns, filename]);

  // Download file helper
  const downloadFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (onExport) {
        onExport(processedData, exportOptions);
      } else {
        switch (exportOptions.format) {
          case 'csv':
            exportToCSV();
            break;
          case 'json':
            exportToJSON();
            break;
          default:
            throw new Error(`Export format ${exportOptions.format} not implemented`);
        }
      }

      toast({
        title: "Export successful",
        description: `Data exported as ${exportOptions.format.toUpperCase()} with ${processedData.length} records.`,
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An error occurred during export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Update selected columns
  const toggleColumn = (columnKey: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      selectedColumns: checked 
        ? [...prev.selectedColumns, columnKey]
        : prev.selectedColumns.filter(key => key !== columnKey)
    }));
  };

  const selectAllColumns = () => {
    setExportOptions(prev => ({
      ...prev,
      selectedColumns: columns.map(col => col.key)
    }));
  };

  const deselectAllColumns = () => {
    setExportOptions(prev => ({
      ...prev,
      selectedColumns: []
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select 
              value={exportOptions.format} 
              onValueChange={(value) => setExportOptions(prev => ({ ...prev, format: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CSV (Comma Separated Values)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    JSON (JavaScript Object Notation)
                  </div>
                </SelectItem>
                <SelectItem value="xlsx" disabled>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel (XLSX) - Coming Soon
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Column Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Columns</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllColumns}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAllColumns}>
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-3">
              {columns.map(column => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.key}
                    checked={exportOptions.selectedColumns.includes(column.key)}
                    onCheckedChange={(checked) => toggleColumn(column.key, checked as boolean)}
                  />
                  <Label 
                    htmlFor={column.key} 
                    className="text-sm cursor-pointer flex-1"
                  >
                    {column.header}
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="text-sm text-gray-600">
              {exportOptions.selectedColumns.length} of {columns.length} columns selected
            </div>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeHeaders"
                checked={exportOptions.includeHeaders}
                onCheckedChange={(checked) => setExportOptions(prev => ({ 
                  ...prev, 
                  includeHeaders: checked as boolean 
                }))}
              />
              <Label htmlFor="includeHeaders" className="text-sm cursor-pointer">
                Include headers
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRows" className="text-sm">Maximum rows to export</Label>
              <Select 
                value={String(exportOptions.maxRows)} 
                onValueChange={(value) => setExportOptions(prev => ({ 
                  ...prev, 
                  maxRows: value === 'all' ? undefined : Number(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 rows</SelectItem>
                  <SelectItem value="1000">1,000 rows</SelectItem>
                  <SelectItem value="5000">5,000 rows</SelectItem>
                  <SelectItem value="10000">10,000 rows</SelectItem>
                  <SelectItem value="all">All rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Preview</Label>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-600">Format</div>
                    <Badge variant="secondary">{exportOptions.format.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">Columns</div>
                    <div>{exportOptions.selectedColumns.length}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">Rows</div>
                    <div>{processedData.length.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Button */}
          <Button 
            onClick={handleExport} 
            disabled={isExporting || exportOptions.selectedColumns.length === 0}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {processedData.length.toLocaleString()} records
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};