import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Search, Download, TrendingUp, TrendingDown, Percent, Eye } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { SalesData } from '@/types/dashboard';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
interface EnhancedDiscountDataTableProps {
  data: SalesData[];
  onRowClick?: (title: string, data: any[], type: string) => void;
}
export const EnhancedDiscountDataTable: React.FC<EnhancedDiscountDataTableProps> = ({
  data,
  onRowClick
}) => {
  const { filters } = useGlobalFilters();
  const periodId = `${filters.dateRange.start}:${filters.dateRange.end}`;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('paymentDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return item.customerName?.toLowerCase().includes(searchLower) || item.customerEmail?.toLowerCase().includes(searchLower) || item.cleanedProduct?.toLowerCase().includes(searchLower) || item.cleanedCategory?.toLowerCase().includes(searchLower) || item.calculatedLocation?.toLowerCase().includes(searchLower) || item.soldBy?.toLowerCase().includes(searchLower);
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[sortColumn as keyof SalesData];
      let bValue = b[sortColumn as keyof SalesData];

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });
    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalDiscount = filteredAndSortedData.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalRevenue = filteredAndSortedData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    const totalMrp = filteredAndSortedData.reduce((sum, item) => sum + (item.mrpPostTax || 0), 0);
    const avgDiscountPercentage = filteredAndSortedData.length > 0 ? filteredAndSortedData.reduce((sum, item) => sum + (item.discountPercentage || 0), 0) / filteredAndSortedData.length : 0;
    return {
      totalDiscount,
      totalRevenue,
      totalMrp,
      avgDiscountPercentage,
      totalTransactions: filteredAndSortedData.length
    };
  }, [filteredAndSortedData]);
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  const handleRowClick = (item: SalesData) => {
    if (onRowClick) {
      onRowClick(`Transaction Details - ${item.customerName}`, [item], 'transaction-detail');
    }
  };
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };
  // Columns definition for AI analysis footer
  const footerColumns = [
    { header: 'Date', key: 'paymentDate', type: 'date' },
    { header: 'Customer', key: 'customerName', type: 'text' },
    { header: 'Product', key: 'cleanedProduct', type: 'text' },
    { header: 'Category', key: 'cleanedCategory', type: 'text' },
    { header: 'MRP (Post Tax)', key: 'mrpPostTax', type: 'currency' },
    { header: 'Discount Amount', key: 'discountAmount', type: 'currency' },
    { header: 'Discount %', key: 'discountPercentage', type: 'percentage' },
    { header: 'Final Amount', key: 'paymentValue', type: 'currency' },
    { header: 'Location', key: 'calculatedLocation', type: 'text' },
    { header: 'Sold By', key: 'soldBy', type: 'text' }
  ];
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const tableId = `Detailed Discount Analysis (${periodId})`;
  useEffect(() => {
    if (!registry) return;
    const el = containerRef.current;
    if (!el) return;
    const getTextContent = () => {
      const table = el.querySelector('table') || el;
      let text = `${tableId}\n`;
      const headerCells = table.querySelectorAll('thead th');
      const headers: string[] = [];
      headerCells.forEach(cell => { const t = cell.textContent?.trim(); if (t) headers.push(t); });
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, tableId]);

  return <Card ref={containerRef} className="shadow-xl border-0 bg-gradient-to-br from-white via-slate-50 to-blue-50/30">
      <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white rounded-t-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Detailed Discount Analysis</CardTitle>

          <div className="p-6 border-t">
          </div>
              <p className="text-slate-200 mt-1">
                Comprehensive transaction-level discount data with advanced filtering
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search transactions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-300" />
            </div>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <CopyTableButton
              tableRef={containerRef as any}
              tableName={tableId}
              size="sm"
              onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Summary Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{formatNumber(summaryStats.totalTransactions)}</div>
            <div className="text-sm text-slate-600">Total Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(summaryStats.totalDiscount)}</div>
            <div className="text-sm text-slate-600">Total Discount</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(summaryStats.totalRevenue)}</div>
            <div className="text-sm text-slate-600">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(summaryStats.totalMrp)}</div>
            <div className="text-sm text-slate-600">Total MRP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{formatPercentage(summaryStats.avgDiscountPercentage)}</div>
            <div className="text-sm text-slate-600">Avg Discount %</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-br from-indigo-800 to-blue-900 ">
              <TableRow className="bg-gradient-to-br from-gray-800 to-indigo-900">
                <TableHead className="cursor-pointer" onClick={() => handleSort('paymentDate')}>
                  <div className="flex items-center gap-2">
                    Date {getSortIcon('paymentDate')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('customerName')}>
                  <div className="flex items-center gap-2">
                    Customer {getSortIcon('customerName')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('cleanedProduct')} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    Product {getSortIcon('cleanedProduct')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort('mrpPostTax')}>
                  <div className="flex items-center justify-end gap-2">
                    MRP {getSortIcon('mrpPostTax')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort('discountAmount')}>
                  <div className="flex items-center justify-end gap-2">
                    Discount {getSortIcon('discountAmount')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort('discountPercentage')}>
                  <div className="flex items-center justify-end gap-2">
                    Discount % {getSortIcon('discountPercentage')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort('paymentValue')}>
                  <div className="flex items-center justify-end gap-2">
                    Final Amount {getSortIcon('paymentValue')}
                  </div>
                </TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Sold By</TableHead>
                <TableHead className="text-center">Actions</TableHead>
                <TableHead className="text-right">
                  <CopyTableButton
                    tableRef={containerRef as any}
                    tableName={tableId}
                    size="sm"
                    onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined}
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => <TableRow key={`${item.saleItemId}-${index}`} className="hover:cursor-pointer max-h-[35px]">
                  <TableCell className="font-medium py-2 max-h-[35px]">
                    <span className="truncate block">{new Date(item.paymentDate).toLocaleDateString()}</span>
                  </TableCell>
                  <TableCell className="py-2 max-h-[35px]">
                    <div className="truncate">
                      <div className="font-medium text-sm text-slate-700 truncate">{item.customerName}</div>
                      <div className="text-xs text-slate-500 truncate">{item.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 max-h-[35px]">
                    <div className="truncate">
                      <div className="font-medium text-sm text-slate-700 truncate">{item.cleanedProduct}</div>
                      <div className="text-xs text-slate-500 truncate">{item.cleanedCategory}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium py-2 max-h-[35px]">
                    <span className="truncate block">{formatCurrency(item.mrpPostTax || 0)}</span>
                  </TableCell>
                  <TableCell className="text-right py-2 max-h-[35px]">
                    <span className="font-medium text-sm text-slate-700 truncate block">
                      -{formatCurrency(item.discountAmount || 0)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-2 max-h-[35px]">
                    <span className="inline-flex justify-end text-sm font-semibold text-slate-700">
                      {formatPercentage(item.discountPercentage || 0)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm text-slate-700 py-2 max-h-[35px]">
                    <span className="truncate block">{formatCurrency(item.paymentValue || 0)}</span>
                  </TableCell>
                  <TableCell className="py-2 max-h-[35px]">
                    <span className="text-sm text-slate-600 truncate block">{item.calculatedLocation}</span>
                  </TableCell>
                  <TableCell className="py-2 max-h-[35px]">
                    <span className="text-sm text-slate-600 truncate block">{item.soldBy}</span>
                  </TableCell>
                  <TableCell className="text-center py-2 max-h-[35px]">
                    <Button variant="outline" size="sm" onClick={() => handleRowClick(item)} className="hover:bg-blue-50 h-7">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>)}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-bold text-white">
                  TOTALS ({formatNumber(summaryStats.totalTransactions)} transactions)
                </TableCell>
                <TableCell className="text-right font-bold text-white">
                  {formatCurrency(summaryStats.totalMrp)}
                </TableCell>
                <TableCell className="text-right font-bold text-white">
                  -{formatCurrency(summaryStats.totalDiscount)}
                </TableCell>
                <TableCell className="text-right font-bold text-white">
                  {formatPercentage(summaryStats.avgDiscountPercentage)}
                </TableCell>
                <TableCell className="text-right font-bold text-white">
                  {formatCurrency(summaryStats.totalRevenue)}
                </TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && <div className="flex items-center justify-between p-4 border-t bg-slate-50">
            <div className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          </div>}
      </CardContent>
        <PersistentTableFooter
          tableId="discounts-detailed-table"
          tableName="Detailed Discount Analysis"
          tableContext="Transaction-level discounts and revenue performance"
          tableData={filteredAndSortedData}
          tableColumns={footerColumns as any}
          className="rounded-b-lg"
        />
    </Card>;
};
