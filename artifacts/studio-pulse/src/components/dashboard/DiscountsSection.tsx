
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Target, TrendingUp, Calendar, MapPin, User, DollarSign } from 'lucide-react';
import { useSalesData } from '@/hooks/useSalesData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

interface DiscountAnalysisData {
  date: string;
  location: string;
  itemsSold: number;
  mrpPreTax: number;
  discountPercentage: number;
  mrpPostTax: number;
  tax: number;
  totalRevenue: number;
}

const DiscountsSection = () => {
  const { data: salesData, loading, error } = useSalesData();
  const { data: payrollData } = usePayrollData();

  // Transform SalesData to DiscountAnalysisData format
  const discountData = useMemo(() => {
    if (!salesData) return [];
    
    return salesData.map(item => ({
      date: item.paymentDate || '',
      location: item.calculatedLocation || 'Unknown',
      itemsSold: 1, // Each sales record represents one item sold
      mrpPreTax: item.mrpPreTax || item.paymentValue || 0,
      discountPercentage: item.discountPercentage || 0,
      mrpPostTax: item.mrpPostTax || item.paymentValue || 0,
      tax: item.paymentVAT || 0,
      totalRevenue: item.paymentValue || 0
    }));
  }, [salesData]);

  const discountColumns: Array<{
    key: keyof DiscountAnalysisData;
    header: string;
    align?: 'left' | 'center' | 'right';
    render?: (value: any, item: any) => React.ReactNode;
  }> = [
    {
      key: 'date',
      header: 'Date',
      align: 'left',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 font-semibold">
            {value}
          </Badge>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location',
      align: 'left',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 font-semibold">
            {value}
          </Badge>
        </div>
      )
    },
    {
      key: 'itemsSold',
      header: 'Items Sold',
      align: 'center',
      render: (value: number) => (
        <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 font-bold">
          {formatNumber(value)}
        </Badge>
      )
    },
    {
      key: 'mrpPreTax',
      header: 'MRP Pre-Tax',
      align: 'right',
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold">
            {formatCurrency(value)}
          </Badge>
        </div>
      )
    },
    {
      key: 'discountPercentage',
      header: 'Discount %',
      align: 'center',
      render: (value: number) => (
        <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 font-semibold">
          {formatPercentage(value)}
        </Badge>
      )
    },
    {
      key: 'mrpPostTax',
      header: 'MRP Post-Tax',
      align: 'right',
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold">
            {formatCurrency(value)}
          </Badge>
        </div>
      )
    },
    {
      key: 'tax',
      header: 'Tax',
      align: 'right',
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold">
            {formatCurrency(value)}
          </Badge>
        </div>
      )
    },
    {
      key: 'totalRevenue',
      header: 'Total Revenue',
      align: 'right',
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold">
            {formatCurrency(value)}
          </Badge>
        </div>
      )
    }
  ];

  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-50 via-yellow-50 to-green-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-green-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          Discount Analysis
          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold">
            {discountData.length} records
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Analysis of discounts applied and their impact on revenue
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ModernDataTable
          data={discountData}
          columns={discountColumns}
          maxHeight="500px"
          tableId="Discount Analysis"
        />
      </CardContent>
    </Card>
  );
};

export default DiscountsSection;
