import React, { useState } from 'react';
import { Copy, Check, FileText, Download } from 'lucide-react';
import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import { toast } from './use-toast';

interface MultiMetricCopyButtonProps {
  tableData: any[];
  metrics: string[];
  tableName?: string;
  className?: string;
  size?: 'sm' | 'lg' | 'default';
  showDropdown?: boolean;
}

export const MultiMetricCopyButton: React.FC<MultiMetricCopyButtonProps> = ({
  tableData,
  metrics,
  tableName = 'Multi-Metric Table',
  className = '',
  size = 'sm' as const,
  showDropdown = true
}) => {
  const [copied, setCopied] = useState(false);

  const copyAllMetricsAsHTML = async () => {
    try {
      // Create comprehensive HTML table with all metrics
      let html = `
        <style>
          .multi-metric-table { 
            border-collapse: collapse; 
            width: 100%; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
          }
          .multi-metric-table th, .multi-metric-table td { 
            border: 1px solid #e2e8f0; 
            padding: 8px 12px; 
            text-align: left;
          }
          .multi-metric-table th { 
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%);
            color: white; 
            font-weight: bold;
            text-align: center;
          }
          .multi-metric-table .metric-header {
            background: linear-gradient(90deg, #1e293b 0%, #334155 100%);
            color: white;
            font-weight: bold;
            text-align: center;
          }
          .multi-metric-table .item-name { 
            background: #f8fafc; 
            font-weight: 600;
            color: #1e293b;
          }
          .multi-metric-table .metric-row { 
            background: #fefefe;
          }
          .multi-metric-table .metric-row:nth-child(even) { 
            background: #f9fafb;
          }
          .multi-metric-table .total-row {
            background: linear-gradient(90deg, #059669 0%, #10b981 100%);
            color: white;
            font-weight: bold;
          }
        </style>
        <table class="multi-metric-table">
          <thead>
            <tr>
              <th colspan="${metrics.length + 1}">${tableName} - All Metrics</th>
            </tr>
            <tr class="metric-header">
              <th>Item</th>
              ${metrics.map(metric => `<th>${metric.charAt(0).toUpperCase() + metric.slice(1)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
      `;

      // Add data rows
      tableData.forEach((row, index) => {
        html += `
          <tr class="metric-row">
            <td class="item-name">${row.name || row.product || row.category || `Item ${index + 1}`}</td>
            ${metrics.map(metric => {
              const value = row[metric] || row[`${metric}Revenue`] || row[`${metric}_value`] || 0;
              return `<td>${formatValue(value, metric)}</td>`;
            }).join('')}
          </tr>
        `;
      });

      // Add totals row if applicable
      if (tableData.length > 0) {
        html += `
          <tr class="total-row">
            <td>TOTALS</td>
            ${metrics.map(metric => {
              const total = tableData.reduce((sum, row) => {
                const value = row[metric] || row[`${metric}Revenue`] || row[`${metric}_value`] || 0;
                return sum + (typeof value === 'number' ? value : parseFloat(value) || 0);
              }, 0);
              return `<td>${formatValue(total, metric)}</td>`;
            }).join('')}
          </tr>
        `;
      }

      html += `
          </tbody>
        </table>
      `;

      // Create HTML blob and copy
      const blob = new Blob([html], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      
      await navigator.clipboard.write([clipboardItem]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: "Table copied!",
        description: `All ${metrics.length} metrics copied with styling`,
      });
    } catch (error) {
      console.error('Failed to copy table:', error);
      // Fallback to text copy
      copyAllMetricsAsText();
    }
  };

  const copyAllMetricsAsText = async () => {
    try {
      // Create tab-separated text with all metrics
      let text = `${tableName} - All Metrics\n`;
      text += `Item\t${metrics.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join('\t')}\n`;

      tableData.forEach((row, index) => {
        const itemName = row.name || row.product || row.category || `Item ${index + 1}`;
        const values = metrics.map(metric => {
          const value = row[metric] || row[`${metric}Revenue`] || row[`${metric}_value`] || 0;
          return formatValue(value, metric);
        });
        text += `${itemName}\t${values.join('\t')}\n`;
      });

      // Add totals row
      if (tableData.length > 0) {
        const totals = metrics.map(metric => {
          const total = tableData.reduce((sum, row) => {
            const value = row[metric] || row[`${metric}Revenue`] || row[`${metric}_value`] || 0;
            return sum + (typeof value === 'number' ? value : parseFloat(value) || 0);
          }, 0);
          return formatValue(total, metric);
        });
        text += `TOTALS\t${totals.join('\t')}\n`;
      }

      await navigator.clipboard.writeText(text);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: "Table copied!",
        description: `All ${metrics.length} metrics copied as text`,
      });
    } catch (error) {
      console.error('Failed to copy table as text:', error);
      toast({
        title: "Error",
        description: "Failed to copy table",
        variant: "destructive"
      });
    }
  };

  const formatValue = (value: any, metric: string): string => {
    if (value === null || value === undefined) return '0';
    
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    
    // Format based on metric type
    if (metric.toLowerCase().includes('revenue') || metric.toLowerCase().includes('atv') || 
        metric.toLowerCase().includes('auv') || metric.toLowerCase().includes('asv')) {
      return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numValue);
    }
    
    if (metric.toLowerCase().includes('percentage') || metric.toLowerCase().includes('rate') ||
        metric.toLowerCase().includes('%')) {
      return `${numValue.toFixed(1)}%`;
    }
    
    return new Intl.NumberFormat('en-IN').format(numValue);
  };

  if (!showDropdown) {
    return (
      <Button
        onClick={copyAllMetricsAsHTML}
        size={size}
        variant="ghost"
        className={`inline-flex items-center gap-1 ${className}`}
        disabled={copied}
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Copy All
          </>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={size}
          variant="ghost"
          className={`inline-flex items-center gap-1 ${className}`}
          disabled={copied}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied!
            </>
          ) : (
            <>
              <Download className="w-3 h-3" />
              Copy All
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border shadow-lg">
        <DropdownMenuItem onClick={copyAllMetricsAsHTML} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          Copy with styling
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyAllMetricsAsText} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          Copy as text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MultiMetricCopyButton;