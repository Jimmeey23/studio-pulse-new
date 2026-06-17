import { useState, useEffect, useCallback } from 'react';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

export interface DetectedTableMetadata {
  id: string;
  name: string;
  element: HTMLElement;
  rowCount: number;
  columnCount: number;
  dataSize: number;
  tableType: 'standard' | 'data-table' | 'registry' | 'component';
  confidence: number;
  location: {
    x: number;
    y: number;
    section: string;
  };
  exportable: boolean;
}

export const useTableDetection = () => {
  const [detectedTables, setDetectedTables] = useState<DetectedTableMetadata[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const registry = useMetricsTablesRegistry();

  const scanForTables = useCallback(async () => {
    setIsScanning(true);
    
    try {
      const tables: DetectedTableMetadata[] = [];
      
      // Method 1: Registry-based detection (highest confidence)
      if (registry) {
        const registeredTables = Array.from(registry.getAllTables().entries());
        for (const [id, tableInfo] of registeredTables) {
          const element = document.querySelector(`[data-table="${id}"]`) as HTMLElement;
          if (element) {
            const metadata = analyzeTableElement(element, id, 'registry', 0.95);
            if (metadata) tables.push(metadata);
          }
        }
      }

      // Method 2: Data-table attribute detection (high confidence)
      const dataTableElements = document.querySelectorAll('[data-table]');
      for (const element of Array.from(dataTableElements) as HTMLElement[]) {
        const id = element.getAttribute('data-table') || `data-table-${Date.now()}`;
        if (!tables.find(t => t.element === element)) {
          const metadata = analyzeTableElement(element, id, 'data-table', 0.85);
          if (metadata) tables.push(metadata);
        }
      }

      // Method 3: Standard HTML table detection (medium confidence)
      const htmlTables = document.querySelectorAll('table');
      for (const element of Array.from(htmlTables) as HTMLElement[]) {
        if (!tables.find(t => t.element === element)) {
          const id = `html-table-${Array.from(htmlTables).indexOf(element)}`;
          const metadata = analyzeTableElement(element, id, 'standard', 0.7);
          if (metadata) tables.push(metadata);
        }
      }

      // Method 4: Component-based detection (lower confidence)
      const componentTables = document.querySelectorAll('[class*="table"], [class*="Table"], [role="table"], [role="grid"]');
      for (const element of Array.from(componentTables) as HTMLElement[]) {
        if (!tables.find(t => t.element === element)) {
          const id = `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const metadata = analyzeTableElement(element, id, 'component', 0.6);
          if (metadata) tables.push(metadata);
        }
      }

      // Sort by confidence and data size
      tables.sort((a, b) => {
        const scoreA = a.confidence * Math.log(a.dataSize + 1);
        const scoreB = b.confidence * Math.log(b.dataSize + 1);
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

  // Auto-scan on mount and when registry changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scanForTables();
    }, 500); // Delay to allow DOM to settle

    return () => clearTimeout(timer);
  }, [scanForTables]);

  // Periodic re-scan for dynamic content
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isScanning) {
        scanForTables();
      }
    }, 10000); // Rescan every 10 seconds

    return () => clearInterval(interval);
  }, [isScanning, scanForTables]);

  return {
    detectedTables,
    isScanning,
    lastScanTime,
    scanForTables,
    totalTables: detectedTables.length,
    exportableTables: detectedTables.filter(t => t.exportable).length,
    totalRows: detectedTables.reduce((sum, t) => sum + t.rowCount, 0)
  };
};

const analyzeTableElement = (
  element: HTMLElement, 
  id: string, 
  type: DetectedTableMetadata['tableType'],
  baseConfidence: number
): DetectedTableMetadata | null => {
  try {
    let rowCount = 0;
    let columnCount = 0;
    let hasData = false;

    // Analyze based on element type
    if (element.tagName === 'TABLE') {
      const rows = element.querySelectorAll('tbody tr');
      const headers = element.querySelectorAll('thead th, thead td');
      
      rowCount = rows.length;
      columnCount = headers.length || (rows[0]?.querySelectorAll('td').length || 0);
      hasData = rowCount > 0 && columnCount > 0;
    } else {
      // For non-table elements, try to detect table-like structure
      const cells = element.querySelectorAll('[data-cell], .table-cell, .cell');
      const rows = element.querySelectorAll('[data-row], .table-row, .row, tr');
      
      rowCount = rows.length || Math.ceil(cells.length / 10); // Estimate
      columnCount = Math.ceil(cells.length / (rowCount || 1));
      hasData = cells.length > 0;
    }

    if (!hasData || rowCount === 0) {
      return null;
    }

    // Get element position
    const rect = element.getBoundingClientRect();
    const section = getElementSection(element);

    // Calculate data size estimate
    const dataSize = rowCount * columnCount;

    // Adjust confidence based on data quality
    let confidence = baseConfidence;
    if (rowCount > 100) confidence *= 1.1; // Bonus for large datasets
    if (columnCount > 10) confidence *= 1.05; // Bonus for wide tables
    if (element.getAttribute('data-table')) confidence *= 1.2; // Bonus for proper identification
    
    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    const metadata: DetectedTableMetadata = {
      id,
      name: extractTableName(element) || `Table ${id}`,
      element,
      rowCount,
      columnCount,
      dataSize,
      tableType: type,
      confidence,
      location: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        section
      },
      exportable: hasData && confidence > 0.5
    };

    return metadata;
  } catch (error) {
    console.error('Table analysis error:', error);
    return null;
  }
};

const extractTableName = (element: HTMLElement): string | null => {
  // Try various methods to get a meaningful name
  const dataTable = element.getAttribute('data-table');
  const ariaLabel = element.getAttribute('aria-label');
  const caption = element.querySelector('caption')?.textContent;
  const nearbyHeading = element.previousElementSibling?.textContent || 
                       element.parentElement?.querySelector('h1, h2, h3, h4')?.textContent;
  
  return dataTable || ariaLabel || caption || nearbyHeading || null;
};

const getElementSection = (element: HTMLElement): string => {
  // Try to determine which section/page the table belongs to
  const section = element.closest('[data-section], section, main, .page, .tab-content');
  
  if (section) {
    const sectionName = section.getAttribute('data-section') ||
                       section.getAttribute('aria-label') ||
                       section.querySelector('h1, h2, h3')?.textContent ||
                       section.className;
    
    if (sectionName) return sectionName;
  }
  
  // Fallback: try to get from URL or page context
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  return segments[segments.length - 1] || 'dashboard';
};