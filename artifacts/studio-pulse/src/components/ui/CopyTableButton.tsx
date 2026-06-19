import React, { useState } from 'react';
import { Copy, Check, FileText, Download, FileCode2, Braces, ClipboardCopy } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { toast } from './use-toast';
import {
  buildAllTablesText,
  extractTableTextFromContainer,
  downloadAsHTML,
  downloadAsJSON,
  downloadAsText,
} from '@/utils/tableCopy';

interface CopyTableButtonProps {
  tableRef: React.RefObject<HTMLTableElement | HTMLDivElement>;
  tableName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
  onCopyAllTabs?: () => Promise<string>;
  contextInfo?: {
    selectedMetric?: string;
    dateRange?: { start: string; end: string };
    filters?: Record<string, any>;
    location?: string;
    additionalInfo?: Record<string, any>;
  };
}

export const CopyTableButton: React.FC<CopyTableButtonProps> = ({
  tableRef,
  tableName = 'Table',
  className = '',
  size = 'sm',
  showDropdown = true,
  onCopyAllTabs,
  contextInfo,
}) => {
  const [copied, setCopied] = useState(false);

  const tableElement = tableRef.current;

  React.useEffect(() => {
    const container = tableElement;
    if (!container) return;

    const tables =
      container instanceof HTMLTableElement
        ? [container]
        : Array.from(container.querySelectorAll('table'));

    if (tables.length === 0 && container instanceof HTMLElement) {
      container.setAttribute('data-has-copy-button', 'true');
      return () => { container.removeAttribute('data-has-copy-button'); };
    }

    tables.forEach(t => t.setAttribute('data-has-copy-button', 'true'));
    return () => { tables.forEach(t => t.removeAttribute('data-has-copy-button')); };
  }, [tableElement]);

  const handleCopyAllTabs = React.useCallback(async () => {
    if (onCopyAllTabs) return onCopyAllTabs();
    return buildAllTablesText(document);
  }, [onCopyAllTabs]);

  const flash = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Copy as HTML (styled) ──────────────────────────────────────────────
  const copyTableAsHTML = async () => {
    if (!tableRef.current) {
      toast({ title: 'Error', description: 'Table not found', variant: 'destructive' });
      return;
    }
    try {
      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
      document.body.appendChild(container);

      const tableClone = tableRef.current.cloneNode(true) as HTMLElement;

      const tbody = tableClone.querySelector('tbody');
      if (tbody) {
        Array.from(tbody.querySelectorAll('tr')).forEach(row => {
          const isGroup =
            row.classList.contains('bg-slate-100') ||
            row.querySelector('svg.lucide-chevron-right, svg.lucide-chevron-down') !== null;
          const isTotal =
            row.classList.contains('bg-slate-800') ||
            row.textContent?.includes('TOTALS') ||
            row.textContent?.includes('Total');
          if (isGroup && !isTotal) row.remove();
        });
      }

      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff}
        table{width:100%;border-collapse:collapse;font-size:13px}
        thead tr{background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-bottom:2px solid #e2e8f0}
        th{padding:10px 14px;text-align:left;font-weight:600;color:#374151;border-right:1px solid #e5e7eb}
        th:last-child{border-right:none}
        tbody tr{border-bottom:1px solid #f3f4f6}
        tbody tr:nth-child(even){background:#f9fafb}
        td{padding:9px 14px;color:#374151;border-right:1px solid #f3f4f6}
        td:last-child{border-right:none}
        tfoot tr{background:#1e293b;color:#f8fafc;font-weight:600}
        tfoot td{padding:10px 14px}
        .table-card{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.1);border:1px solid #e2e8f0;overflow:hidden;margin:16px 0}
        .table-header{background:linear-gradient(135deg,#f8fafc,#f1f5f9);padding:16px 20px;border-bottom:1px solid #e2e8f0}
        .table-title{font-size:18px;font-weight:600;color:#111827;margin:0}
        .table-subtitle{font-size:13px;color:#6b7280;margin:4px 0 0}
      `;

      const wrapper = document.createElement('div');
      wrapper.className = 'table-card';
      const header = document.createElement('div');
      header.className = 'table-header';
      header.innerHTML = `<h3 class="table-title">${tableName}</h3><p class="table-subtitle">Exported ${new Date().toLocaleDateString()}</p>`;
      wrapper.appendChild(header);
      wrapper.appendChild(styleSheet);
      wrapper.appendChild(tableClone);
      container.appendChild(wrapper);

      const htmlContent = wrapper.outerHTML;

      if (navigator.clipboard?.write) {
        try {
          const blob = new Blob([htmlContent], { type: 'text/html' });
          await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
        } catch {
          await navigator.clipboard.writeText(tableClone.textContent || '');
        }
      } else {
        const ta = document.createElement('textarea');
        ta.value = htmlContent;
        container.appendChild(ta);
        ta.select();
        document.execCommand('copy');
      }

      document.body.removeChild(container);
      flash();
      toast({ title: 'Copied to Clipboard', description: `${tableName} copied with styling` });
    } catch (err) {
      toast({ title: 'Copy Failed', description: String(err), variant: 'destructive' });
    }
  };

  // ── Copy as plain text ─────────────────────────────────────────────────
  const copyTableAsText = async () => {
    if (!tableRef.current) {
      toast({ title: 'Error', description: 'Table not found', variant: 'destructive' });
      return;
    }
    try {
      const text = extractTableTextFromContainer(
        tableRef.current as HTMLElement,
        tableName,
        contextInfo,
      );
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      flash();
      toast({ title: 'Copied to Clipboard', description: `${tableName} copied as text` });
    } catch (err) {
      toast({ title: 'Copy Failed', description: String(err), variant: 'destructive' });
    }
  };

  // ── Copy all tabs ──────────────────────────────────────────────────────
  const copyAllTabsAsText = async () => {
    try {
      const content = await handleCopyAllTabs();
      await navigator.clipboard.writeText(content);
      flash();
      toast({ title: 'Copied All Tabs', description: 'All metric tables copied to clipboard' });
    } catch (err) {
      toast({ title: 'Copy Failed', description: String(err), variant: 'destructive' });
    }
  };

  // ── File downloads ─────────────────────────────────────────────────────
  const handleDownloadHTML = () => {
    if (!tableRef.current) return;
    try {
      downloadAsHTML(tableRef.current as HTMLElement, tableName);
      toast({ title: 'Downloaded', description: `${tableName} saved as HTML` });
    } catch (err) {
      toast({ title: 'Export Failed', description: String(err), variant: 'destructive' });
    }
  };

  const handleDownloadJSON = () => {
    if (!tableRef.current) return;
    try {
      downloadAsJSON(tableRef.current as HTMLElement, tableName);
      toast({ title: 'Downloaded', description: `${tableName} saved as JSON` });
    } catch (err) {
      toast({ title: 'Export Failed', description: String(err), variant: 'destructive' });
    }
  };

  const handleDownloadText = () => {
    if (!tableRef.current) return;
    try {
      downloadAsText(tableRef.current as HTMLElement, tableName);
      toast({ title: 'Downloaded', description: `${tableName} saved as text file` });
    } catch (err) {
      toast({ title: 'Export Failed', description: String(err), variant: 'destructive' });
    }
  };

  // ── Size helpers ───────────────────────────────────────────────────────
  const buttonSize = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }[size];
  const iconSize   = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }[size];

  // ── Render ─────────────────────────────────────────────────────────────
  if (!showDropdown) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={copyTableAsHTML}
        data-copy-table-button="true"
        className={`${buttonSize} border-slate-300 bg-transparent text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-100 ${className}`}
        title={`Copy ${tableName} with styling`}
      >
        {copied ? <Check className={`${iconSize} text-green-600`} /> : <Copy className={iconSize} />}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-copy-table-button="true"
          variant="outline"
          size="icon"
          className={`${buttonSize} border-slate-300 bg-transparent text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-100 ${className}`}
          title={`Export ${tableName}`}
        >
          {copied ? (
            <Check className={`${iconSize} text-green-600`} />
          ) : (
            <Copy className={iconSize} />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {/* ── Copy to clipboard ── */}
        <DropdownMenuLabel className="text-xs text-slate-500 font-medium px-2 py-1">
          Copy to Clipboard
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={copyTableAsHTML} className="flex items-center gap-2">
          <ClipboardCopy className="h-4 w-4 text-slate-500" />
          <span>Copy with styling</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={copyTableAsText} className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-500" />
          <span>Copy as text</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={copyAllTabsAsText} className="flex items-center gap-2">
          <Copy className="h-4 w-4 text-slate-500" />
          <span>Copy all tabs</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* ── Download as file ── */}
        <DropdownMenuLabel className="text-xs text-slate-500 font-medium px-2 py-1">
          Download as File
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={handleDownloadHTML} className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-blue-500" />
          <span>Export as HTML</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDownloadJSON} className="flex items-center gap-2">
          <Braces className="h-4 w-4 text-amber-500" />
          <span>Export as JSON</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDownloadText} className="flex items-center gap-2">
          <Download className="h-4 w-4 text-emerald-500" />
          <span>Export as Text</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CopyTableButton;
