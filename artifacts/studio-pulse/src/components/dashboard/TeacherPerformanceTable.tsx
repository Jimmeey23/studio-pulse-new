import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCheck, Users, Target, TrendingUp, Award, FileText, Image, Download } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useRegisterTableForCopy } from '@/hooks/useRegisterTableForCopy';
import { isConvertedInCohort, isInNewClientCohort, isRetainedInCohort } from '@/utils/clientRetention';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TeacherPerformanceTableProps {
  data: NewClientData[];
  onRowClick?: (rowData: any) => void;
}

interface TeacherStats {
  trainerName: string;
  newMembers: number;
  sessions: number;
  converted: number;
  conversionRate: number;
  retained: number;
  retentionRate: number;
}

export const TeacherPerformanceTable: React.FC<TeacherPerformanceTableProps> = ({
  data,
  onRowClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableTitle = 'Teacher Performance Analysis';
  const { getAllTabsText } = useRegisterTableForCopy(containerRef as any, tableTitle);
  const [displayMode, setDisplayMode] = useState<'values' | 'growth'>('values');

  const teacherStats = useMemo(() => {
    const stats = new Map<string, {
      newMembers: Set<string>;
      sessions: number;
      converted: Set<string>;
      retained: Set<string>;
    }>();

    // Process data to calculate teacher statistics
    data.forEach(client => {
      const trainerName = client.trainerName || 'Unknown Trainer';
      
      if (!stats.has(trainerName)) {
        stats.set(trainerName, {
          newMembers: new Set(),
          sessions: 0,
          converted: new Set(),
          retained: new Set()
        });
      }

      const trainerStats = stats.get(trainerName)!;
      
      // Track unique new members
      if (isInNewClientCohort(client) && client.memberId) {
        trainerStats.newMembers.add(client.memberId);
      }
      
      // Track sessions (visits)
      trainerStats.sessions += client.classNo || 0;
      
      // Track conversions
      if (isConvertedInCohort(client) && client.memberId) {
        trainerStats.converted.add(client.memberId);
      }
      
      // Track retention
      if (isRetainedInCohort(client) && client.memberId) {
        trainerStats.retained.add(client.memberId);
      }
    });

    // Convert to array and calculate rates
    const results: TeacherStats[] = Array.from(stats.entries()).map(([trainerName, stats]) => {
      const newMembers = stats.newMembers.size;
      const converted = stats.converted.size;
      const retained = stats.retained.size;
      
      return {
        trainerName,
        newMembers,
        sessions: stats.sessions,
        converted,
        conversionRate: newMembers > 0 ? (converted / newMembers) * 100 : 0,
        retained,
        retentionRate: newMembers > 0 ? (retained / newMembers) * 100 : 0,
      };
    });

    // Sort by new members descending
    return results.sort((a, b) => b.newMembers - a.newMembers);
  }, [data]);

  // Sorting state
  const [sortField, setSortField] = useState<string | undefined>('newMembers');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedData = useMemo(() => {
    if (!sortField) return [...teacherStats];
    const copy = [...teacherStats];
    copy.sort((a: any, b: any) => {
      const va = a[sortField as keyof TeacherStats];
      const vb = b[sortField as keyof TeacherStats];
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDirection === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const na = Number(va || 0);
      const nb = Number(vb || 0);
      return sortDirection === 'asc' ? na - nb : nb - na;
    });
    return copy;
  }, [teacherStats, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export functions
  const exportToCSV = () => {
    const csvHeaders = ['Teacher Name', 'New Members', 'Sessions', 'Converted', 'Conversion Rate', 'Retained', 'Retention Rate'];
    const csvData = sortedData.map(teacher => [
      teacher.trainerName,
      teacher.newMembers,
      teacher.sessions,
      teacher.converted,
      `${teacher.conversionRate.toFixed(1)}%`,
      teacher.retained,
      `${teacher.retentionRate.toFixed(1)}%`
    ]);
    // Append totals row
    const totalsRow = [
      totals.trainerName,
      totals.newMembers,
      totals.sessions,
      totals.converted,
      `${totals.conversionRate.toFixed(1)}%`,
      totals.retained,
      `${totals.retentionRate.toFixed(1)}%`
    ];

    // Basic CSV escaping for commas/newlines
    const escape = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const csvContent = [
      csvHeaders.map(escape).join(','),
      ...csvData.map(row => row.map(escape).join(',')),
      totalsRow.map(escape).join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher-performance.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    if (!containerRef.current) return;

    // Render a full offscreen table (all rows + totals) with proper styling
    const offscreen = document.createElement('div');
    offscreen.style.position = 'absolute';
    offscreen.style.left = '-99999px';
    offscreen.style.top = '0';
    offscreen.style.background = '#ffffff';
    offscreen.style.padding = '20px';
    offscreen.style.color = '#000';
    offscreen.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    offscreen.style.fontSize = '14px';
    offscreen.style.width = '1200px';

    // Add title
    const title = document.createElement('h1');
    title.textContent = 'Teacher Performance Analysis';
    title.style.fontSize = '24px';
    title.style.fontWeight = '600';
    title.style.marginBottom = '20px';
    title.style.color = '#1f2937';
    title.style.textAlign = 'center';
    offscreen.appendChild(title);

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.background = '#ffffff';
    table.style.color = '#000';
    table.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    table.style.borderRadius = '8px';
    table.style.overflow = 'hidden';
    
    const thead = document.createElement('thead');
    thead.style.background = 'linear-gradient(to right, #334155, #1e293b, #4f46e5)';
    const headerRow = document.createElement('tr');
    ['Teacher Name','New Members','Sessions','Converted','Conversion Rate','Retained','Retention Rate'].forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      th.style.textAlign = 'center';
      th.style.padding = '12px 8px';
      th.style.border = '1px solid #e5e7eb';
      th.style.color = '#ffffff';
      th.style.fontWeight = '600';
      th.style.fontSize = '12px';
      th.style.textTransform = 'uppercase';
      th.style.letterSpacing = '0.05em';
      th.style.background = 'linear-gradient(to right, #334155, #1e293b, #4f46e5)';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    sortedData.forEach(r => {
      const tr = document.createElement('tr');
      [r.trainerName, r.newMembers, r.sessions, r.converted, `${r.conversionRate.toFixed(1)}%`, r.retained, `${r.retentionRate.toFixed(1)}%`].forEach(cell => {
        const td = document.createElement('td');
        td.textContent = String(cell);
        td.style.padding = '6px 8px';
        td.style.border = '1px solid #e5e7eb';
        td.style.height = '35px';
        td.style.whiteSpace = 'nowrap';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    // totals row
    const trTotal = document.createElement('tr');
    trTotal.style.backgroundColor = '#f3f4f6';
    trTotal.style.borderTop = '2px solid #d1d5db';
    [totals.trainerName, totals.newMembers, totals.sessions, totals.converted, `${totals.conversionRate.toFixed(1)}%`, totals.retained, `${totals.retentionRate.toFixed(1)}%`].forEach((cell, cellIndex) => {
      const td = document.createElement('td');
      td.textContent = String(cell);
      td.style.padding = '12px 8px';
      td.style.border = '1px solid #d1d5db';
      td.style.fontWeight = '700';
      td.style.height = '40px';
      td.style.color = '#111827';
      td.style.fontSize = '14px';
      td.style.textAlign = cellIndex === 0 ? 'left' : 'center';
      td.style.backgroundColor = '#f9fafb';
      trTotal.appendChild(td);
    });
    tbody.appendChild(trTotal);
    table.appendChild(tbody);
    offscreen.appendChild(table);
    document.body.appendChild(offscreen);

    const canvas = await html2canvas(offscreen, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgWidth = 297;
    const pageHeight = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('teacher-performance.pdf');

    // Cleanup offscreen
    try { document.body.removeChild(offscreen); } catch (e) { /* ignore */ }
  };

  const exportToPNG = async () => {
    // Build offscreen table for full content with proper styling
    const offscreen = document.createElement('div');
    offscreen.style.position = 'absolute';
    offscreen.style.left = '-99999px';
    offscreen.style.top = '0';
    offscreen.style.background = '#ffffff';
    offscreen.style.padding = '20px';
    offscreen.style.color = '#000';
    offscreen.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    offscreen.style.fontSize = '14px';
    offscreen.style.width = '1200px';

    // Add title
    const title = document.createElement('h1');
    title.textContent = 'Teacher Performance Analysis';
    title.style.fontSize = '24px';
    title.style.fontWeight = '600';
    title.style.marginBottom = '20px';
    title.style.color = '#1f2937';
    title.style.textAlign = 'center';
    offscreen.appendChild(title);

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.background = '#ffffff';
    table.style.color = '#000';
    table.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    table.style.borderRadius = '8px';
    table.style.overflow = 'hidden';
    
    const thead = document.createElement('thead');
    thead.style.background = 'linear-gradient(to right, #334155, #1e293b, #4f46e5)';
    const headerRow = document.createElement('tr');
    ['Teacher Name','New Members','Sessions','Converted','Conversion Rate','Retained','Retention Rate'].forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      th.style.textAlign = 'center';
      th.style.padding = '12px 8px';
      th.style.border = '1px solid #e5e7eb';
      th.style.color = '#ffffff';
      th.style.fontWeight = '600';
      th.style.fontSize = '12px';
      th.style.textTransform = 'uppercase';
      th.style.letterSpacing = '0.05em';
      th.style.background = 'linear-gradient(to right, #334155, #1e293b, #4f46e5)';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    sortedData.forEach((r, index) => {
      const tr = document.createElement('tr');
      tr.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
      tr.style.borderBottom = '1px solid #e5e7eb';
      
      [r.trainerName, r.newMembers, r.sessions, r.converted, `${r.conversionRate.toFixed(1)}%`, r.retained, `${r.retentionRate.toFixed(1)}%`].forEach((cell, cellIndex) => {
        const td = document.createElement('td');
        td.textContent = String(cell);
        td.style.padding = '10px 8px';
        td.style.border = '1px solid #e5e7eb';
        td.style.height = '35px';
        td.style.whiteSpace = 'nowrap';
        td.style.color = '#374151';
        td.style.fontSize = '13px';
        td.style.textAlign = cellIndex === 0 ? 'left' : 'center';
        td.style.fontWeight = cellIndex === 0 ? '500' : '400';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    const trTotal = document.createElement('tr');
    trTotal.style.backgroundColor = '#f3f4f6';
    trTotal.style.borderTop = '2px solid #d1d5db';
    [totals.trainerName, totals.newMembers, totals.sessions, totals.converted, `${totals.conversionRate.toFixed(1)}%`, totals.retained, `${totals.retentionRate.toFixed(1)}%`].forEach((cell, cellIndex) => {
      const td = document.createElement('td');
      td.textContent = String(cell);
      td.style.padding = '12px 8px';
      td.style.border = '1px solid #d1d5db';
      td.style.fontWeight = '700';
      td.style.height = '40px';
      td.style.color = '#111827';
      td.style.fontSize = '14px';
      td.style.textAlign = cellIndex === 0 ? 'left' : 'center';
      td.style.backgroundColor = '#f9fafb';
      trTotal.appendChild(td);
    });
    tbody.appendChild(trTotal);
    table.appendChild(tbody);
    offscreen.appendChild(table);
    document.body.appendChild(offscreen);

    const canvas = await html2canvas(offscreen, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const link = document.createElement('a');
    link.download = 'teacher-performance.png';
    link.href = canvas.toDataURL();
    link.click();

    try { document.body.removeChild(offscreen); } catch (e) { /* ignore */ }
  };
  const totals = useMemo(() => {
    const totalNewMembers = teacherStats.reduce((sum, t) => sum + t.newMembers, 0);
    const totalSessions = teacherStats.reduce((sum, t) => sum + t.sessions, 0);
    const totalConverted = teacherStats.reduce((sum, t) => sum + t.converted, 0);
    const totalRetained = teacherStats.reduce((sum, t) => sum + t.retained, 0);
    
    return {
      trainerName: 'TOTAL',
      newMembers: totalNewMembers,
      sessions: totalSessions,
      converted: totalConverted,
      conversionRate: totalNewMembers > 0 ? (totalConverted / totalNewMembers) * 100 : 0,
      retained: totalRetained,
      retentionRate: totalNewMembers > 0 ? (totalRetained / totalNewMembers) * 100 : 0,
    };
  }, [teacherStats]);

  // Calculate growth data (placeholder since we don't have historical data)
  const growthColumns = [
    {
      key: 'trainerName',
      header: 'Teacher Name',
      render: (value: string) => (
        <div className="truncate text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          {value}
        </div>
      ),
      align: 'left' as const,
      sortable: true
    },
    {
      key: 'newMembers',
      header: 'New Members Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'sessions',
      header: 'Sessions Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'converted',
      header: 'Conversions Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'conversionRate',
      header: 'Conv. Rate Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'retained',
      header: 'Retention Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'retentionRate',
      header: 'Ret. Rate Growth',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          --% (No historical data)
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
  ];

  const columns = displayMode === 'values' ? [
    {
      key: 'trainerName',
      header: 'Teacher Name',
      render: (value: string) => (
        <div className="truncate text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          {value}
        </div>
      ),
      align: 'left' as const,
      sortable: true
    },
    {
      key: 'newMembers',
      header: 'New Members',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'sessions',
      header: 'Sessions',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'converted',
      header: 'Converted',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'conversionRate',
      header: 'Conversion Rate',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          {formatPercentage(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'retained',
      header: 'Retained',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          {formatNumber(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
    {
      key: 'retentionRate',
      header: 'Retention Rate',
      render: (value: number) => (
        <div className="text-center text-black font-medium" style={{ maxHeight: '35px', lineHeight: '35px' }}>
          {formatPercentage(value)}
        </div>
      ),
      align: 'center' as const,
      sortable: true
    },
  ] : growthColumns;

  return (
    <div ref={containerRef} className="space-y-6">
      <Card className="shadow-xl border-0 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-gray-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white mb-1">
                  Teacher Performance Analysis
                </CardTitle>
                <p className="text-blue-200 text-sm">
                  Comprehensive teacher metrics including conversions and retention rates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                {teacherStats.length} Teachers
              </Badge>
              
              {/* Display Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={displayMode === 'values' ? 'default' : 'outline'}
                  onClick={() => setDisplayMode('values')}
                  className={displayMode === 'values' ? 'h-8 border-teal-300/40 bg-teal-500 text-white hover:bg-teal-400' : 'h-8 border-white/20 bg-white/10 text-teal-100 hover:bg-teal-500/20 hover:text-white'}
                >
                  Values
                </Button>
                <Button
                  size="sm"
                  variant={displayMode === 'growth' ? 'default' : 'outline'}
                  onClick={() => setDisplayMode('growth')}
                  className={displayMode === 'growth' ? 'h-8 border-teal-300/40 bg-teal-500 text-white hover:bg-teal-400' : 'h-8 border-white/20 bg-white/10 text-teal-100 hover:bg-teal-500/20 hover:text-white'}
                >
                  Growth
                </Button>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={exportToCSV}
                  className="h-8 gap-1 border-white/20 bg-white/10 text-teal-100 hover:bg-teal-500/20 hover:text-white"
                  variant="outline"
                >
                  <FileText className="w-3 h-3" />
                  CSV
                </Button>
                <Button
                  size="sm"
                  onClick={exportToPNG}
                  className="h-8 gap-1 border-white/20 bg-white/10 text-teal-100 hover:bg-teal-500/20 hover:text-white"
                  variant="outline"
                >
                  <Image className="w-3 h-3" />
                  PNG
                </Button>
                <Button
                  size="sm"
                  onClick={exportToPDF}
                  className="h-8 gap-1 border-white/20 bg-white/10 text-teal-100 hover:bg-teal-500/20 hover:text-white"
                  variant="outline"
                >
                  <Download className="w-3 h-3" />
                  PDF
                </Button>
              </div>

              <CopyTableButton 
                tableRef={containerRef}
                tableName={tableTitle}
                size="sm"
                onCopyAllTabs={async () => getAllTabsText()}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div style={{ 
            '--row-height': '35px',
            '--text-color': '#000000',
            '--bg-color': '#ffffff'
          } as React.CSSProperties}>
            <ModernDataTable
              data={sortedData}
              columns={columns}
              headerGradient="from-slate-950 via-slate-900 to-slate-800"
              showFooter={true}
              footerData={totals}
              footerRowClassName="border-t-4 border-teal-950 bg-teal-950 text-slate-50 hover:bg-teal-900"
              footerStickyCellClassName="bg-teal-950 border-teal-900"
              footerCellClassName="bg-teal-950 border-teal-900 text-slate-50"
              footerSectionStyle={{ ['--unified-totals-bg' as string]: '#115e59', ['--unified-totals-text' as string]: '#ffffff', ['--unified-totals-border' as string]: 'rgba(255, 255, 255, 0.16)', backgroundColor: '#115e59', color: '#ffffff', borderTopColor: '#0f766e' }}
              footerRowStyle={{ ['--unified-totals-bg' as string]: '#115e59', ['--unified-totals-text' as string]: '#ffffff', ['--unified-totals-border' as string]: 'rgba(255, 255, 255, 0.16)', backgroundColor: '#115e59', color: '#ffffff', borderTopColor: '#0f766e' }}
              footerStickyCellStyle={{ ['--unified-totals-bg' as string]: '#115e59', ['--unified-totals-text' as string]: '#ffffff', ['--unified-totals-border' as string]: 'rgba(255, 255, 255, 0.16)', backgroundColor: '#115e59', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.16)', borderTopColor: '#0f766e' }}
              footerCellStyle={{ ['--unified-totals-bg' as string]: '#115e59', ['--unified-totals-text' as string]: '#ffffff', ['--unified-totals-border' as string]: 'rgba(255, 255, 255, 0.16)', backgroundColor: '#115e59', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.16)', borderTopColor: '#0f766e' }}
              maxHeight="600px"
              stickyHeader={true}
              onRowClick={onRowClick ? (row) => onRowClick(row) : undefined}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
              tableId={tableTitle}
              className="teacher-performance-table"
            />
          </div>
          
          <style>{`
            .teacher-performance-table tbody tr {
              height: 35px !important;
              max-height: 35px !important;
              background-color: white !important;
            }
            /* Uniform white background for all rows per request */
            .teacher-performance-table tbody tr:nth-child(even) {
              background-color: white !important;
            }
            .teacher-performance-table tbody tr:hover {
              background-color: white !important;
            }
            .teacher-performance-table td {
              height: 35px !important;
              max-height: 35px !important;
              padding: 8px 12px !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              color: black !important;
            }
            .teacher-performance-table .truncate {
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              white-space: nowrap !important;
            }
          `}</style>
        </CardContent>
      </Card>
    </div>
  );
};