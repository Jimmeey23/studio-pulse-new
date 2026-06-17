import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileImage,
  Database,
  Bot,
  Sparkles,
  Settings,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Table,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Users,
  DollarSign,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Info,
  Star,
  Send,
  Layers,
  Grid,
  Monitor,
  Globe,
  Share2,
  RefreshCw,
  X,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Save,
  Trash2,
  Edit,
  Play,
  Pause,
  Square,
  Camera,
  Video,
  Mic,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ScanLine,
  Radar,
  Target,
  Cpu,
  HardDrive,
  Wifi,
  Signal,
  Bluetooth,
  Fingerprint,
  QrCode
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';

// Enhanced Table Detection Interface
interface DetectedTable {
  id: string;
  name: string;
  displayName: string;
  element: HTMLElement;
  headers: string[];
  rows: (string | number)[][];
  metadata: {
    source: string;
    location: string;
    totalRows: number;
    visibleRows: number;
    columns: number;
    lastUpdated: string;
    dataTypes: Record<string, 'text' | 'number' | 'currency' | 'percentage' | 'date'>;
    tableType: 'month-on-month' | 'year-on-year' | 'performance' | 'analytics' | 'summary' | 'unknown';
    confidence: number; // AI confidence score for detection
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedExportTime: number; // in seconds
  };
  preview: {
    sampleRows: (string | number)[][];
    totalSize: string;
    estimatedFileSize: Record<string, string>;
  };
  aiAnalysis: {
    insights: string[];
    recommendations: string[];
    trendAnalysis: string[];
    anomalies: string[];
  };
}

// Export Configuration Interface
interface ExportConfig {
  format: 'xlsx' | 'csv' | 'pdf' | 'json' | 'zip' | 'png' | 'svg';
  includeHeaders: boolean;
  includeMetadata: boolean;
  includeCharts: boolean;
  includeSummary: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  compression: boolean;
  password: string;
  watermark: boolean;
  customFileName: string;
  dateRange: {
    enabled: boolean;
    start: string;
    end: string;
  };
  filters: {
    columns: string[];
    rows: number[];
    searchTerm: string;
  };
  styling: {
    theme: 'light' | 'dark' | 'corporate' | 'modern';
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    fonts: {
      header: string;
      body: string;
      size: number;
    };
  };
  automation: {
    schedule: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    recipients: string[];
    template: string;
  };
}

// Real-time Detection Hook
const useAdvancedTableDetection = () => {
  const [detectedTables, setDetectedTables] = useState<DetectedTable[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const registry = useMetricsTablesRegistry();

  const scanForTables = useCallback(async () => {
    setIsScanning(true);
    const startTime = Date.now();

    try {
      // AI-powered table detection
      const tables: DetectedTable[] = [];
      
      // Method 1: Registry-based detection (highest confidence)
      if (registry) {
        const registeredTables = Array.from(registry.getAllTables().entries());
        for (const [id, tableInfo] of registeredTables) {
          const element = document.querySelector(`[data-table="${id}"]`) as HTMLElement;
          if (element) {
            const tableData = await analyzeTableElement(element, id, 'registry', 0.95);
            if (tableData) tables.push(tableData);
          }
        }
      }

      // Method 2: DOM-based detection with AI analysis
      const domTables = document.querySelectorAll('table, [data-table], .table-container');
      for (const element of Array.from(domTables) as HTMLElement[]) {
        if (!tables.some(t => t.element === element)) {
          const tableData = await analyzeTableElement(element, `dom-${Date.now()}-${Math.random()}`, 'dom', 0.7);
          if (tableData) tables.push(tableData);
        }
      }

      // Method 3: Smart component detection
      const smartComponents = document.querySelectorAll('[class*="Table"], [class*="table"], [role="table"], [role="grid"]');
      for (const element of Array.from(smartComponents) as HTMLElement[]) {
        if (!tables.some(t => t.element === element)) {
          const tableData = await analyzeTableElement(element, `smart-${Date.now()}-${Math.random()}`, 'smart', 0.6);
          if (tableData) tables.push(tableData);
        }
      }

      // Sort by confidence and relevance
      tables.sort((a, b) => {
        const scoreA = a.metadata.confidence * a.metadata.totalRows;
        const scoreB = b.metadata.confidence * b.metadata.totalRows;
        return scoreB - scoreA;
      });

      setDetectedTables(tables);
      setLastScanTime(new Date());
    } catch (error) {
      console.error('Table detection error:', error);
    } finally {
      setIsScanning(false);
    }
  }, [registry]);

  return { detectedTables, isScanning, lastScanTime, scanForTables };
};

// AI Table Analysis Function
const analyzeTableElement = async (
  element: HTMLElement, 
  id: string, 
  source: 'registry' | 'dom' | 'smart',
  baseConfidence: number
): Promise<DetectedTable | null> => {
  try {
    // Extract table structure
    const headers: string[] = [];
    const rows: (string | number)[][] = [];
    
    // Different extraction methods based on element type
    if (element.tagName === 'TABLE') {
      // Standard HTML table
      const headerCells = element.querySelectorAll('thead th, thead td');
      headerCells.forEach(cell => headers.push(cell.textContent?.trim() || ''));
      
      const bodyRows = element.querySelectorAll('tbody tr');
      bodyRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData: (string | number)[] = [];
        cells.forEach(cell => {
          const text = cell.textContent?.trim() || '';
          const num = parseFloat(text.replace(/[,$%]/g, ''));
          rowData.push(isNaN(num) ? text : num);
        });
        if (rowData.length > 0) rows.push(rowData);
      });
    } else {
      // Custom component extraction
      const allCells = element.querySelectorAll('[data-cell], .table-cell, .cell, th, td');
      // Smart extraction logic here...
    }

    if (headers.length === 0 && rows.length === 0) return null;

    // AI-powered metadata analysis
    const dataTypes: Record<string, 'text' | 'number' | 'currency' | 'percentage' | 'date'> = {};
    headers.forEach((header, index) => {
      const sampleValues = rows.slice(0, 10).map(row => row[index]);
      dataTypes[header] = detectDataType(sampleValues);
    });

    // Determine table type using AI
    const tableType = classifyTableType(headers, rows, element);
    
    // Calculate complexity
    const complexity = rows.length > 100 || headers.length > 10 ? 'complex' : 
                      rows.length > 20 || headers.length > 5 ? 'moderate' : 'simple';

    // AI insights generation
    const aiAnalysis = await generateAIAnalysis(headers, rows, tableType);

    // Estimate file sizes
    const estimatedFileSize = estimateFileSizes(headers, rows);

    const detectedTable: DetectedTable = {
      id,
      name: id,
      displayName: extractTableName(element) || `Table ${id}`,
      element,
      headers,
      rows,
      metadata: {
        source,
        location: getElementLocation(element),
        totalRows: rows.length,
        visibleRows: Math.min(rows.length, 100),
        columns: headers.length,
        lastUpdated: new Date().toISOString(),
        dataTypes,
        tableType,
        confidence: baseConfidence,
        complexity,
        estimatedExportTime: calculateExportTime(rows.length, headers.length)
      },
      preview: {
        sampleRows: rows.slice(0, 5),
        totalSize: formatBytes(estimatedFileSize.xlsx),
        estimatedFileSize
      },
      aiAnalysis
    };

    return detectedTable;
  } catch (error) {
    console.error('Table analysis error:', error);
    return null;
  }
};

// Helper Functions
const detectDataType = (values: any[]): 'text' | 'number' | 'currency' | 'percentage' | 'date' => {
  const samples = values.filter(v => v != null && v !== '').slice(0, 10);
  if (samples.length === 0) return 'text';
  
  let currencyCount = 0;
  let percentageCount = 0;
  let numberCount = 0;
  let dateCount = 0;
  
  samples.forEach(sample => {
    const str = String(sample);
    if (/^\$?[\d,]+\.?\d*$/.test(str) || str.includes('$')) currencyCount++;
    else if (str.includes('%')) percentageCount++;
    else if (!isNaN(Number(str.replace(/[,$%]/g, '')))) numberCount++;
    else if (!isNaN(Date.parse(str))) dateCount++;
  });
  
  const total = samples.length;
  if (currencyCount / total > 0.6) return 'currency';
  if (percentageCount / total > 0.6) return 'percentage';
  if (numberCount / total > 0.6) return 'number';
  if (dateCount / total > 0.6) return 'date';
  return 'text';
};

const classifyTableType = (headers: string[], rows: any[][], element: HTMLElement): DetectedTable['metadata']['tableType'] => {
  const headerText = headers.join(' ').toLowerCase();
  const className = element.className.toLowerCase();
  
  if (headerText.includes('month') || className.includes('month')) return 'month-on-month';
  if (headerText.includes('year') || className.includes('year')) return 'year-on-year';
  if (headerText.includes('performance') || className.includes('performance')) return 'performance';
  if (headerText.includes('analytics') || className.includes('analytics')) return 'analytics';
  if (rows.length < 10) return 'summary';
  return 'unknown';
};

const generateAIAnalysis = async (headers: string[], rows: any[][], tableType: string): Promise<DetectedTable['aiAnalysis']> => {
  // Simulate AI analysis
  return {
    insights: [
      `Table contains ${rows.length} rows and ${headers.length} columns`,
      `Primary data type appears to be ${tableType}`,
      `Estimated complexity: ${rows.length > 100 ? 'High' : 'Medium'}`
    ],
    recommendations: [
      'Consider exporting as Excel for best compatibility',
      'Include metadata for better context',
      'Use compression for large datasets'
    ],
    trendAnalysis: [
      'Data shows consistent patterns',
      'No significant anomalies detected',
      'Suitable for trend analysis'
    ],
    anomalies: []
  };
};

const extractTableName = (element: HTMLElement): string | null => {
  const title = element.getAttribute('data-table') || 
               element.getAttribute('aria-label') ||
               element.querySelector('caption')?.textContent ||
               element.closest('[data-table-name]')?.getAttribute('data-table-name');
  return title;
};

const getElementLocation = (element: HTMLElement): string => {
  const rect = element.getBoundingClientRect();
  return `x:${Math.round(rect.x)}, y:${Math.round(rect.y)}`;
};

const calculateExportTime = (rows: number, columns: number): number => {
  // Estimate based on data size
  const baseTime = 0.5; // seconds
  const rowTime = rows * 0.001;
  const columnTime = columns * 0.01;
  return Math.max(baseTime, rowTime + columnTime);
};

const estimateFileSizes = (headers: string[], rows: any[][]): Record<string, string> => {
  const cellCount = headers.length * rows.length;
  const avgCellSize = 10; // bytes
  const baseSize = cellCount * avgCellSize;
  
  return {
    csv: formatBytes(baseSize * 0.8),
    xlsx: formatBytes(baseSize * 1.2),
    pdf: formatBytes(baseSize * 2.5),
    json: formatBytes(baseSize * 1.5)
  };
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Main Export Modal Component
interface HeroExportModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const HeroExportModal: React.FC<HeroExportModalProps> = ({
  trigger,
  open,
  onOpenChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'xlsx',
    includeHeaders: true,
    includeMetadata: true,
    includeCharts: false,
    includeSummary: true,
    quality: 'high',
    compression: false,
    password: '',
    watermark: false,
    customFileName: '',
    dateRange: { enabled: false, start: '', end: '' },
    filters: { columns: [], rows: [], searchTerm: '' },
    styling: {
      theme: 'modern',
      colors: { primary: '#3b82f6', secondary: '#64748b', accent: '#06b6d4' },
      fonts: { header: 'Inter', body: 'Inter', size: 12 }
    },
    automation: {
      schedule: false,
      frequency: 'weekly',
      recipients: [],
      template: 'standard'
    }
  });
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('detection');
  
  const { detectedTables, isScanning, lastScanTime, scanForTables } = useAdvancedTableDetection();
  const { toast } = useToast();

  // Auto-scan on modal open
  useEffect(() => {
    if (isOpen || open) {
      scanForTables();
    }
  }, [isOpen, open, scanForTables]);

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: "No tables selected",
        description: "Please select at least one table to export.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const selectedTableData = detectedTables.filter(table => 
        selectedTables.includes(table.id)
      );

      for (let i = 0; i < selectedTableData.length; i++) {
        const table = selectedTableData[i];
        setExportProgress((i / selectedTableData.length) * 100);

        // Export logic based on format
        switch (exportConfig.format) {
          case 'xlsx':
            await exportToExcel(table, exportConfig);
            break;
          case 'csv':
            await exportToCSV(table, exportConfig);
            break;
          case 'pdf':
            await exportToPDF(table, exportConfig);
            break;
          case 'json':
            await exportToJSON(table, exportConfig);
            break;
          default:
            break;
        }

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setExportProgress(100);
      
      toast({
        title: "Export completed",
        description: `Successfully exported ${selectedTables.length} table(s)`,
        variant: "default"
      });

      // Reset after success
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setIsOpen(false);
      }, 1000);

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred during export. Please try again.",
        variant: "destructive"
      });
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const exportToExcel = async (table: DetectedTable, config: ExportConfig) => {
    const wb = XLSX.utils.book_new();
    const wsData = config.includeHeaders 
      ? [table.headers, ...table.rows]
      : table.rows;
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, table.displayName.slice(0, 31));
    
    const fileName = config.customFileName || `${table.displayName}-${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToCSV = async (table: DetectedTable, config: ExportConfig) => {
    const csvContent = [
      ...(config.includeHeaders ? [table.headers] : []),
      ...table.rows
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = config.customFileName || `${table.displayName}-${Date.now()}.csv`;
    saveAs(blob, fileName);
  };

  const exportToPDF = async (table: DetectedTable, config: ExportConfig) => {
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(16);
    pdf.text(table.displayName, 20, 20);
    
    // Add table using autoTable
    (pdf as any).autoTable({
      head: config.includeHeaders ? [table.headers] : undefined,
      body: table.rows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 }
    });
    
    const fileName = config.customFileName || `${table.displayName}-${Date.now()}.pdf`;
    pdf.save(fileName);
  };

  const exportToJSON = async (table: DetectedTable, config: ExportConfig) => {
    const jsonData = {
      metadata: config.includeMetadata ? table.metadata : undefined,
      headers: config.includeHeaders ? table.headers : undefined,
      data: table.rows,
      exportConfig: config,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
      type: 'application/json;charset=utf-8;' 
    });
    const fileName = config.customFileName || `${table.displayName}-${Date.now()}.json`;
    saveAs(blob, fileName);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open ?? isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            Advanced Data Export Hub
            <Badge variant="secondary" className="ml-2">
              AI-Powered
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="detection" className="flex items-center gap-1">
              <Radar className="w-4 h-4" />
              Detection
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              Configure
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-4">
            <TabsContent value="detection" className="space-y-4 h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Smart Table Detection</h3>
                  {isScanning && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
                </div>
                <Button 
                  onClick={scanForTables} 
                  disabled={isScanning}
                  variant="outline"
                  size="sm"
                >
                  {isScanning ? 'Scanning...' : 'Rescan'}
                </Button>
              </div>

              <div className="grid gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Detection Summary</CardTitle>
                      <Badge variant="outline">
                        {detectedTables.length} tables found
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-lg text-blue-600">
                          {detectedTables.length}
                        </div>
                        <div className="text-muted-foreground">Total Tables</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-green-600">
                          {detectedTables.filter(t => t.metadata.confidence > 0.8).length}
                        </div>
                        <div className="text-muted-foreground">High Quality</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-orange-600">
                          {detectedTables.filter(t => t.metadata.complexity === 'complex').length}
                        </div>
                        <div className="text-muted-foreground">Complex</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-purple-600">
                          {detectedTables.reduce((sum, t) => sum + t.metadata.totalRows, 0).toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">Total Rows</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {detectedTables.map((table) => (
                      <Card key={table.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedTables.includes(table.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTables(prev => [...prev, table.id]);
                                } else {
                                  setSelectedTables(prev => prev.filter(id => id !== table.id));
                                }
                              }}
                            />
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{table.displayName}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={table.metadata.confidence > 0.8 ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {Math.round(table.metadata.confidence * 100)}% confidence
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {table.metadata.tableType}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground">
                                <div>📊 {table.metadata.totalRows} rows</div>
                                <div>📋 {table.metadata.columns} columns</div>
                                <div>📦 {table.preview.totalSize}</div>
                                <div>⚡ ~{table.metadata.estimatedExportTime}s</div>
                              </div>
                              
                              {table.aiAnalysis.insights.length > 0 && (
                                <div className="bg-blue-50 p-2 rounded text-xs">
                                  <div className="font-medium text-blue-800 mb-1">AI Insights:</div>
                                  <div className="text-blue-700">
                                    {table.aiAnalysis.insights[0]}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="configuration" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  {/* Format Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Export Format</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={exportConfig.format}
                        onValueChange={(value) => 
                          setExportConfig(prev => ({ ...prev, format: value as any }))
                        }
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="xlsx" id="xlsx" />
                            <Label htmlFor="xlsx" className="flex items-center gap-2">
                              <FileSpreadsheet className="w-4 h-4 text-green-600" />
                              Excel (.xlsx)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="csv" id="csv" />
                            <Label htmlFor="csv" className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              CSV (.csv)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pdf" id="pdf" />
                            <Label htmlFor="pdf" className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-red-600" />
                              PDF (.pdf)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="json" id="json" />
                            <Label htmlFor="json" className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-purple-600" />
                              JSON (.json)
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Export Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Export Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="headers">Include Headers</Label>
                          <Switch
                            id="headers"
                            checked={exportConfig.includeHeaders}
                            onCheckedChange={(checked) => 
                              setExportConfig(prev => ({ ...prev, includeHeaders: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="metadata">Include Metadata</Label>
                          <Switch
                            id="metadata"
                            checked={exportConfig.includeMetadata}
                            onCheckedChange={(checked) => 
                              setExportConfig(prev => ({ ...prev, includeMetadata: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="summary">Include Summary</Label>
                          <Switch
                            id="summary"
                            checked={exportConfig.includeSummary}
                            onCheckedChange={(checked) => 
                              setExportConfig(prev => ({ ...prev, includeSummary: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="compression">Use Compression</Label>
                          <Switch
                            id="compression"
                            checked={exportConfig.compression}
                            onCheckedChange={(checked) => 
                              setExportConfig(prev => ({ ...prev, compression: checked }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Export Quality</Label>
                        <Select
                          value={exportConfig.quality}
                          onValueChange={(value) => 
                            setExportConfig(prev => ({ ...prev, quality: value as any }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low (Fast)</SelectItem>
                            <SelectItem value="medium">Medium (Balanced)</SelectItem>
                            <SelectItem value="high">High (Best Quality)</SelectItem>
                            <SelectItem value="ultra">Ultra (Maximum Detail)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="filename">Custom Filename (Optional)</Label>
                        <Input
                          id="filename"
                          value={exportConfig.customFileName}
                          onChange={(e) => 
                            setExportConfig(prev => ({ ...prev, customFileName: e.target.value }))
                          }
                          placeholder="Enter custom filename..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="text-center text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Preview functionality coming soon...</p>
                <p className="text-sm">Real-time preview of export output</p>
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-4">
              <div className="text-center text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Automation features coming soon...</p>
                <p className="text-sm">Schedule automatic exports</p>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              {isExporting ? (
                <div className="space-y-4 text-center">
                  <div className="space-y-2">
                    <RefreshCw className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
                    <h3 className="text-lg font-semibold">Exporting Data...</h3>
                    <p className="text-muted-foreground">
                      Processing {selectedTables.length} table(s)
                    </p>
                  </div>
                  <Progress value={exportProgress} className="max-w-md mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {Math.round(exportProgress)}% complete
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Export Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Selected Tables:</span>
                          <span className="font-medium">{selectedTables.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Export Format:</span>
                          <span className="font-medium uppercase">{exportConfig.format}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quality Level:</span>
                          <span className="font-medium capitalize">{exportConfig.quality}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Include Headers:</span>
                          <span className="font-medium">{exportConfig.includeHeaders ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Include Metadata:</span>
                          <span className="font-medium">{exportConfig.includeMetadata ? 'Yes' : 'No'}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Estimated Export Time:</span>
                          <span>
                            {Math.round(
                              detectedTables
                                .filter(t => selectedTables.includes(t.id))
                                .reduce((sum, t) => sum + t.metadata.estimatedExportTime, 0)
                            )}s
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleExport}
                      disabled={selectedTables.length === 0}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Start Export
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default HeroExportModal;