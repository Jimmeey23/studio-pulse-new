import React, { useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter 
} from '@/components/ui/table';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  Package, 
  TrendingDown,
  Eye,
  Percent,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { SalesData } from '@/types/dashboard';
import { PersistentTableFooter } from '@/components/dashboard/PersistentTableFooter';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

interface EnhancedDiscountBreakdownTablesProps {
  data: SalesData[];
  onDrillDown?: (title: string, data: any[], type: string) => void;
}

export const EnhancedDiscountBreakdownTables: React.FC<EnhancedDiscountBreakdownTablesProps> = ({ 
  data, 
  onDrillDown 
}) => {
  const productRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const staffRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();

  useEffect(() => {
    if (!registry) return;
    const register = (ref: React.RefObject<HTMLDivElement>, id: string) => {
      const el = ref.current;
      if (!el) return;
      const getTextContent = () => {
        const table = el.querySelector('table') || el;
        let text = `${id}\n`;
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
      registry.register({ id, getTextContent });
    };
    register(productRef, 'Product-wise Discount Breakdown');
    register(locationRef, 'Location-wise Discount Breakdown');
    register(staffRef, 'Staff-wise Discount Breakdown');
    return () => {
      registry.unregister('Product-wise Discount Breakdown');
      registry.unregister('Location-wise Discount Breakdown');
      registry.unregister('Staff-wise Discount Breakdown');
    };
  }, [registry]);
  
  // Product breakdown
  const productBreakdown = useMemo(() => {
    const breakdown = data.reduce((acc, item) => {
      const key = item.cleanedProduct || 'Unknown Product';
      if (!acc[key]) {
        acc[key] = {
          product: key,
          category: item.cleanedCategory || 'Unknown',
          transactions: 0,
          totalDiscount: 0,
          totalRevenue: 0,
          totalMrp: 0,
          avgDiscountPercentage: 0,
          data: []
        };
      }
      acc[key].transactions += 1;
      acc[key].totalDiscount += item.discountAmount || 0;
      acc[key].totalRevenue += item.paymentValue || 0;
      acc[key].totalMrp += item.mrpPostTax || 0;
      acc[key].data.push(item);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(breakdown).map((item: any) => ({
      ...item,
      avgDiscountPercentage: item.totalMrp > 0 ? (item.totalDiscount / item.totalMrp) * 100 : 0,
      discountRate: item.transactions > 0 ? (item.totalDiscount / item.transactions) : 0
    })).sort((a, b) => b.totalDiscount - a.totalDiscount);
  }, [data]);

  // Location breakdown
  const locationBreakdown = useMemo(() => {
    const breakdown = data.reduce((acc, item) => {
      const key = item.calculatedLocation || 'Unknown Location';
      if (!acc[key]) {
        acc[key] = {
          location: key,
          transactions: 0,
          totalDiscount: 0,
          totalRevenue: 0,
          totalMrp: 0,
          uniqueCustomers: new Set(),
          data: []
        };
      }
      acc[key].transactions += 1;
      acc[key].totalDiscount += item.discountAmount || 0;
      acc[key].totalRevenue += item.paymentValue || 0;
      acc[key].totalMrp += item.mrpPostTax || 0;
      acc[key].uniqueCustomers.add(item.customerEmail);
      acc[key].data.push(item);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(breakdown).map((item: any) => ({
      ...item,
      uniqueCustomers: item.uniqueCustomers.size,
      avgDiscountPercentage: item.totalMrp > 0 ? (item.totalDiscount / item.totalMrp) * 100 : 0,
      avgDiscountPerTransaction: item.transactions > 0 ? (item.totalDiscount / item.transactions) : 0
    })).sort((a, b) => b.totalDiscount - a.totalDiscount);
  }, [data]);

  // Staff breakdown
  const staffBreakdown = useMemo(() => {
    const breakdown = data.reduce((acc, item) => {
      const key = item.soldBy || 'Unknown';
      if (!acc[key]) {
        acc[key] = {
          staff: key,
          transactions: 0,
          totalDiscount: 0,
          totalRevenue: 0,
          totalMrp: 0,
          data: []
        };
      }
      acc[key].transactions += 1;
      acc[key].totalDiscount += item.discountAmount || 0;
      acc[key].totalRevenue += item.paymentValue || 0;
      acc[key].totalMrp += item.mrpPostTax || 0;
      acc[key].data.push(item);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(breakdown).map((item: any) => ({
      ...item,
      avgDiscountPercentage: item.totalMrp > 0 ? (item.totalDiscount / item.totalMrp) * 100 : 0,
      discountRate: item.transactions > 0 ? (item.totalDiscount / item.transactions) : 0
    })).sort((a, b) => b.totalDiscount - a.totalDiscount);
  }, [data]);

  const handleDrillDown = (title: string, data: any[], type: string) => {
    if (onDrillDown) {
      onDrillDown(title, data, type);
    }
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 20) return { label: 'High' };
    return { label: 'Low' };
  };

  return (
    <div className="grid gap-6">
      {/* Product Breakdown */}
      <Card ref={productRef} className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Product-wise Discount Breakdown</CardTitle>
              <p className="text-slate-200 mt-1">
                Discount performance analysis by product category
              </p>
            </div>
            <CopyTableButton
              tableRef={productRef as any}
              tableName="Product-wise Discount Breakdown"
              size="sm"
              onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined}
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Transactions</TableHead>
                  <TableHead className="text-right">Total Discount</TableHead>
                  <TableHead className="text-right">Avg Discount %</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Discount Impact</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productBreakdown.slice(0, 10).map((item, index) => {
                  const badge = getPerformanceBadge(item.avgDiscountPercentage);
                  return (
                    <TableRow key={index} className="max-h-[35px]">
                      <TableCell className="font-medium py-2 max-h-[35px]">
                        <div className="max-w-[200px] truncate text-sm" title={item.product}>
                          {item.product}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 max-h-[35px]">
                        <span className="text-sm text-slate-600 truncate block">{item.category}</span>
                      </TableCell>
                      <TableCell className="text-center py-2 max-h-[35px]">
                        <span className="inline-flex text-sm font-semibold text-slate-700">{formatNumber(item.transactions)}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm text-slate-700 py-2 max-h-[35px]">
                        <span className="truncate block">{formatCurrency(item.totalDiscount)}</span>
                      </TableCell>
                      <TableCell className="text-right py-2 max-h-[35px]">
                        <span className="inline-flex text-sm font-semibold text-slate-700">
                          {formatPercentage(item.avgDiscountPercentage)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm text-slate-700 py-2 max-h-[35px]">
                        <span className="truncate block">{formatCurrency(item.totalRevenue)}</span>
                      </TableCell>
                      <TableCell className="text-right py-2 max-h-[35px]">
                        <div className="text-xs truncate">
                          <div className="font-medium truncate">{formatCurrency(item.discountRate)}</div>
                          <div className="text-slate-500 truncate">per transaction</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2 max-h-[35px]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDrillDown(
                            `${item.product} - Discount Analysis`, 
                            item.data, 
                            'product-discount'
                          )}
                          className="hover:bg-slate-50 h-7"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold text-white">Total (Top 10)</TableCell>
                  <TableCell className="text-center font-bold text-white">
                    {formatNumber(productBreakdown.slice(0, 10).reduce((sum, item) => sum + item.transactions, 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white">
                    {formatCurrency(productBreakdown.slice(0, 10).reduce((sum, item) => sum + item.totalDiscount, 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white">
                    {formatPercentage(
                      productBreakdown.slice(0, 10).reduce((sum, item) => sum + item.avgDiscountPercentage, 0) / 
                      Math.min(10, productBreakdown.length)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white">
                    {formatCurrency(productBreakdown.slice(0, 10).reduce((sum, item) => sum + item.totalRevenue, 0))}
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Product AI Footer */}
      <PersistentTableFooter
        tableId="discounts-product-breakdown"
        tableName="Product-wise Discount Breakdown"
        tableContext="Discounts grouped by product and category with impact metrics"
        tableData={productBreakdown}
        tableColumns={[
          { header: 'Product', key: 'product', type: 'text' },
          { header: 'Category', key: 'category', type: 'text' },
          { header: 'Transactions', key: 'transactions', type: 'number' },
          { header: 'Total Discount', key: 'totalDiscount', type: 'currency' },
          { header: 'Avg Discount %', key: 'avgDiscountPercentage', type: 'percentage' },
          { header: 'Total Revenue', key: 'totalRevenue', type: 'currency' }
        ] as any}
      />

      {/* Location Breakdown */}
      <Card ref={locationRef} className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Location-wise Discount Breakdown</CardTitle>
              <p className="text-slate-200 mt-1">
                Geographic analysis of discount utilization patterns
              </p>
            </div>
            <CopyTableButton
              tableRef={locationRef as any}
              tableName="Location-wise Discount Breakdown"
              size="sm"
              onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined}
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Transactions</TableHead>
                  <TableHead className="text-center">Customers</TableHead>
                  <TableHead className="text-right">Total Discount</TableHead>
                  <TableHead className="text-right">Avg Discount %</TableHead>
                  <TableHead className="text-right">Avg per Transaction</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationBreakdown.map((item, index) => {
                  const badge = getPerformanceBadge(item.avgDiscountPercentage);
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.location}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex text-sm font-semibold text-slate-700">{formatNumber(item.transactions)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex text-sm font-semibold text-slate-700">{formatNumber(item.uniqueCustomers)}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700">
                        {formatCurrency(item.totalDiscount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex text-sm font-semibold text-slate-700">
                          {formatPercentage(item.avgDiscountPercentage)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700">
                        {formatCurrency(item.avgDiscountPerTransaction)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700">
                        {formatCurrency(item.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDrillDown(
                            `${item.location} - Discount Analysis`, 
                            item.data, 
                            'location-discount'
                          )}
                          className="hover:bg-slate-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold text-white">Total</TableCell>
                  <TableCell className="text-center font-bold text-white">
                    {formatNumber(locationBreakdown.reduce((sum, item) => sum + item.transactions, 0))}
                  </TableCell>
                  <TableCell className="text-center font-bold text-white">
                    {formatNumber(locationBreakdown.reduce((sum, item) => sum + item.uniqueCustomers, 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white">
                    {formatCurrency(locationBreakdown.reduce((sum, item) => sum + item.totalDiscount, 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white">
                    {formatPercentage(
                      locationBreakdown.reduce((sum, item) => sum + item.avgDiscountPercentage, 0) / 
                      locationBreakdown.length
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white">
                    {formatCurrency(
                      locationBreakdown.reduce((sum, item) => sum + item.avgDiscountPerTransaction, 0) / 
                      locationBreakdown.length
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white">
                    {formatCurrency(locationBreakdown.reduce((sum, item) => sum + item.totalRevenue, 0))}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Location AI Footer */}
      <PersistentTableFooter
        tableId="discounts-location-breakdown"
        tableName="Location-wise Discount Breakdown"
        tableContext="Discounts grouped by studio location with customer counts and impact"
        tableData={locationBreakdown}
        tableColumns={[
          { header: 'Location', key: 'location', type: 'text' },
          { header: 'Transactions', key: 'transactions', type: 'number' },
          { header: 'Customers', key: 'uniqueCustomers', type: 'number' },
          { header: 'Total Discount', key: 'totalDiscount', type: 'currency' },
          { header: 'Avg Discount %', key: 'avgDiscountPercentage', type: 'percentage' },
          { header: 'Avg per Txn', key: 'avgDiscountPerTransaction', type: 'currency' },
          { header: 'Revenue', key: 'totalRevenue', type: 'currency' }
        ] as any}
      />

      {/* Staff Breakdown */}
      <Card ref={staffRef} className="shadow-xl border-0 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20">
        <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Staff-wise Discount Breakdown</CardTitle>
              <p className="text-slate-200 mt-1">
                Analysis of discount authorization by sales staff
              </p>
            </div>
            <CopyTableButton
              tableRef={staffRef as any}
              tableName="Staff-wise Discount Breakdown"
              size="sm"
              onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined}
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead className="text-center">Transactions</TableHead>
                  <TableHead className="text-right">Total Discount</TableHead>
                  <TableHead className="text-right">Avg Discount %</TableHead>
                  <TableHead className="text-right">Discount per Sale</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffBreakdown.map((item, index) => {
                  const badge = getPerformanceBadge(item.avgDiscountPercentage);
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.staff}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex text-sm font-semibold text-slate-700">{formatNumber(item.transactions)}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700">
                        {formatCurrency(item.totalDiscount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex text-sm font-semibold text-slate-700">
                          {formatPercentage(item.avgDiscountPercentage)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.discountRate)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700">
                        {formatCurrency(item.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                          {badge.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDrillDown(
                            `${item.staff} - Discount Analysis`, 
                            item.data, 
                            'staff-discount'
                          )}
                          className="hover:bg-purple-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold text-white">Total</TableCell>
                  <TableCell className="text-center font-bold text-white">
                    {formatNumber(staffBreakdown.reduce((sum, item) => sum + item.transactions, 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white">
                    {formatCurrency(staffBreakdown.reduce((sum, item) => sum + item.totalDiscount, 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white">
                    {formatPercentage(
                      staffBreakdown.reduce((sum, item) => sum + item.avgDiscountPercentage, 0) / 
                      staffBreakdown.length
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white">
                    {formatCurrency(
                      staffBreakdown.reduce((sum, item) => sum + item.discountRate, 0) / 
                      staffBreakdown.length
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white">
                    {formatCurrency(staffBreakdown.reduce((sum, item) => sum + item.totalRevenue, 0))}
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Staff AI Footer */}
      <PersistentTableFooter
        tableId="discounts-staff-breakdown"
        tableName="Staff-wise Discount Breakdown"
        tableContext="Discount authorization and revenue by staff member"
        tableData={staffBreakdown}
        tableColumns={[
          { header: 'Staff', key: 'staff', type: 'text' },
          { header: 'Transactions', key: 'transactions', type: 'number' },
          { header: 'Total Discount', key: 'totalDiscount', type: 'currency' },
          { header: 'Avg Discount %', key: 'avgDiscountPercentage', type: 'percentage' },
          { header: 'Discount per Sale', key: 'discountRate', type: 'currency' },
          { header: 'Revenue', key: 'totalRevenue', type: 'currency' }
        ] as any}
      />
    </div>
  );
};
