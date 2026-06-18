import React from 'react';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

interface RegisterTableOptions {
  selectedMetric?: string;
  dateRange?: { start: string; end: string };
  filters?: Record<string, any>;
  location?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Registers a table container ref with the MetricsTablesRegistry to enable
 * the "Copy all tabs" option automatically.
 * Call with the container that wraps your <table> (or the table itself).
 */
export function useRegisterTableForCopy(
  ref: React.RefObject<HTMLElement>,
  title?: string,
  disabled?: boolean,
  contextOptions?: RegisterTableOptions
) {
  const registry = useMetricsTablesRegistry();

  React.useEffect(() => {
    if (disabled) return;
    if (!registry) return;
    if (!ref.current) return;
    if (!title) return;

    const getText = () => {
      const container = ref.current! as HTMLElement;
      const table = container.querySelector('table') || container;
      let text = `${title}\n`;
      text += `Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;
      
      // Add context information if provided
      if (contextOptions) {
        text += `\n--- Export Context ---\n`;
        
        if (contextOptions.selectedMetric) {
          text += `Metric: ${contextOptions.selectedMetric}\n`;
        }
        
        // Add location information
        if (contextOptions.location) {
          text += `Location: ${contextOptions.location}\n`;
        } else if (contextOptions.filters?.location) {
          // Handle location from filters
          const locationValue = Array.isArray(contextOptions.filters.location) 
            ? contextOptions.filters.location.join(', ') 
            : contextOptions.filters.location;
          if (locationValue && locationValue !== 'all') {
            text += `Location: ${locationValue}\n`;
          } else {
            text += `Location: All Locations\n`;
          }
        } else {
          text += `Location: All Locations\n`;
        }
        
        if (contextOptions.dateRange) {
          const { start, end } = contextOptions.dateRange;
          if (start && end) {
            text += `Date Range: ${start} to ${end}\n`;
          }
        }
        
        if (contextOptions.filters) {
          const activeFilters: string[] = [];
          Object.entries(contextOptions.filters).forEach(([key, value]) => {
            // Skip location as it's handled separately
            if (key === 'location') return;
            
            if (value && Array.isArray(value) && value.length > 0) {
              activeFilters.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.join(', ')}`);
            } else if (value && typeof value === 'string' && value !== 'All' && value !== '') {
              activeFilters.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
            }
          });
          
          if (activeFilters.length > 0) {
            text += `Applied Filters: ${activeFilters.join('; ')}\n`;
          } else {
            text += `Applied Filters: None\n`;
          }
        }
        
        if (contextOptions.additionalInfo) {
          Object.entries(contextOptions.additionalInfo).forEach(([key, value]) => {
            if (value) {
              text += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
            }
          });
        }
        
        text += `\n--- Table Data (Headers + Data Rows + Totals) ---\n`;
        text += `Note: Grouped/Category rows have been excluded\n`;
      } else {
        text += `\n`;
      }
      
      const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td');
      const headers: string[] = [];
      headerCells.forEach(cell => { const t = cell.textContent?.trim(); if (t) headers.push(t); });
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      rows.forEach(row => {
        // Enhanced detection for grouped/category rows (same logic as CopyTableButton)
        const isGroupRow = (
          // Common group row styling classes
          row.classList.contains('bg-slate-100') || 
          row.classList.contains('bg-gray-100') ||
          row.classList.contains('bg-slate-50') ||
          row.classList.contains('bg-gray-50') ||
          row.classList.contains('group-row') ||
          row.classList.contains('category-row') ||
          row.classList.contains('section-header') ||
          row.classList.contains('group-header') ||
          row.classList.contains('category-header') ||
          
          // Detect expand/collapse buttons (chevron icons)
          row.querySelector('button[class*="ChevronRight"], button[class*="ChevronDown"]') !== null ||
          row.querySelector('svg.lucide-chevron-right, svg.lucide-chevron-down') !== null ||
          row.querySelector('[data-lucide="chevron-right"], [data-lucide="chevron-down"]') !== null ||
          row.querySelector('.fa-chevron-right, .fa-chevron-down') !== null ||
          
          // Detect if row has data attributes indicating it's a group
          row.hasAttribute('data-group') ||
          row.hasAttribute('data-category') ||
          row.hasAttribute('data-section') ||
          row.hasAttribute('data-grouped') ||
          
          // Detect if first cell spans multiple columns (common in group headers)
          (() => {
            const firstCell = row.querySelector('td:first-child, th:first-child');
            return firstCell && (
              firstCell.getAttribute('colspan') && parseInt(firstCell.getAttribute('colspan') || '1') > 1
            );
          })() ||
          
          // Detect common group row text patterns
          (() => {
            const rowText = row.textContent?.trim().toLowerCase() || '';
            return (
              rowText.includes('expand') ||
              rowText.includes('collapse') ||
              rowText.includes('show more') ||
              rowText.includes('show less') ||
              (rowText.includes('items') && !rowText.match(/\d+\s+items/)) ||
              rowText.includes('category:') ||
              rowText.includes('group:') ||
              rowText.includes('section:') ||
              (rowText.length > 0 && rowText.length < 50 && 
               !rowText.match(/\d/) && 
               !rowText.includes('₹') && 
               !rowText.includes('%') && 
               !rowText.includes(':') && 
               row.querySelectorAll('td, th').length <= 2)
            );
          })()
        );
        
        // Enhanced detection for totals/summary rows (these should be included)
        const isTotalsRow = (
          row.classList.contains('bg-slate-800') || 
          row.classList.contains('bg-gray-800') ||
          row.classList.contains('bg-slate-900') ||
          row.classList.contains('totals-row') ||
          row.classList.contains('summary-row') ||
          row.classList.contains('footer-row') ||
          (() => {
            const rowText = row.textContent?.trim() || '';
            return (
              rowText.includes('TOTALS') ||
              rowText.includes('TOTAL') ||
              rowText.includes('Total') ||
              rowText.includes('Sum') ||
              rowText.includes('Summary') ||
              rowText.includes('Grand Total') ||
              rowText.includes('Subtotal') ||
              (() => {
                const firstCell = row.querySelector('td:first-child, th:first-child');
                const firstCellText = firstCell?.textContent?.trim().toLowerCase() || '';
                return (
                  firstCellText === 'total' ||
                  firstCellText === 'totals' ||
                  firstCellText === 'grand total' ||
                  firstCellText === 'summary' ||
                  firstCellText.startsWith('total ')
                );
              })()
            );
          })()
        );
        
        // Skip group rows but always include totals rows and regular data rows
        if (isGroupRow && !isTotalsRow) {
          return;
        }
        
        const cells = row.querySelectorAll('td, th');
        const rowData: string[] = [];
        cells.forEach(cell => {
          // Skip cells that are just expand/collapse buttons
          const hasOnlyButton = cell.querySelector('button') && !cell.textContent?.trim().replace(/[\s\n\r]+/g, '').length;
          if (hasOnlyButton) {
            rowData.push(''); // Add empty cell for button columns
          } else {
            const text = cell.textContent?.trim() || '';
            rowData.push(text);
          }
        });
        
        // Only add row if it has meaningful content
        if (rowData.length > 0 && rowData.some(cell => cell !== '')) {
          text += rowData.join('\t') + '\n';
        }
      });
      return text.trim();
    };

    registry.register({ id: title, getTextContent: getText });
    return () => registry.unregister(title);
  }, [registry, ref, title, disabled, contextOptions]);

  const getAllTabsText = React.useCallback(async () => {
    if (!registry) return '';
    return registry.getAllTabsContent();
  }, [registry]);

  return { getAllTabsText };
}
