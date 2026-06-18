import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { X, TrendingUp, Calendar, DollarSign, Tag, MapPin, Percent, ShoppingCart } from 'lucide-react';
import { SpenderData, LapsedMemberData, TransactionDetail } from '@/hooks/useOutlierMonthAnalytics';
import { SalesData } from '@/types/dashboard';

interface OutlierDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    type: 'spender' | 'lapsed' | 'new-transactions' | 'repeat-transactions' | 'membership';
    title: string;
    spenderData?: SpenderData;
    lapsedData?: LapsedMemberData;
    transactions?: TransactionDetail[];
    membershipTransactions?: SalesData[];
    membershipName?: string;
  };
}

export const OutlierDrillDownModal: React.FC<OutlierDrillDownModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!data) return null;

  const renderSpenderDetails = (spender: SpenderData) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(spender.totalSpent)}</div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{formatNumber(spender.transactions)}</div>
            <div className="text-sm text-gray-600">Transactions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(spender.avgTransaction)}</div>
            <div className="text-sm text-gray-600">Avg Transaction</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(spender.totalDiscountReceived || 0)}</div>
            <div className="text-sm text-gray-600">Total Discounts</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge variant={spender.isNew ? 'default' : 'secondary'} className="text-sm">
                {spender.isNew ? 'New Client' : 'Repeat Client'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Membership Status:</span>
              <Badge 
                variant={spender.membershipStatus === 'Active' ? 'default' : 'outline'}
                className={`text-sm ${
                  spender.membershipStatus === 'Active' ? 'bg-green-100 text-green-700' :
                  spender.membershipStatus === 'Frozen' ? 'bg-blue-100 text-blue-700' :
                  spender.membershipStatus === 'Expired' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}
              >
                {spender.membershipStatus || 'None'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {spender.lastMembershipName && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{spender.lastMembershipName}</div>
                <div className="text-sm text-gray-700 mt-1">
                  End Date: {spender.lastMembershipEndDate ? new Date(spender.lastMembershipEndDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Savings</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spender.rawTransactions?.map((txn, index) => {
                  const mrp = txn.mrpPostTax || txn.mrpPreTax || 0;
                  const savings = mrp > 0 ? mrp - (txn.paymentValue || 0) : 0;
                  return (
                    <TableRow key={index}>
                      <TableCell>{new Date(txn.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-xs truncate">{txn.cleanedProduct || txn.paymentItem}</TableCell>
                      <TableCell className="text-gray-500">
                        {mrp > 0 ? formatCurrency(mrp) : '-'}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(txn.paymentValue || 0)}</TableCell>
                      <TableCell>
                        {(txn.discountAmount || 0) > 0 ? (
                          <span className="text-green-600">
                            {formatCurrency(txn.discountAmount || 0)} ({formatPercentage(txn.discountPercentage || 0)})
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {savings > 0 ? (
                          <span className="text-emerald-600 font-medium">
                            {formatCurrency(savings)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{txn.calculatedLocation}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderLapsedDetails = (lapsed: LapsedMemberData) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{lapsed.daysSinceLapsed}</div>
            <div className="text-sm text-gray-600">Days Lapsed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(lapsed.totalLifetimeValue)}</div>
            <div className="text-sm text-gray-600">Lifetime Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(lapsed.lastPurchaseAmount)}</div>
            <div className="text-sm text-gray-600">Last Purchase</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-semibold text-gray-900">{lapsed.lastMembershipType}</div>
            <div className="text-xs text-gray-600">Last Membership</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-amber-600 mt-1" />
            <div>
              <div className="font-semibold text-gray-900">Membership Ended</div>
              <div className="text-sm text-gray-700">
                {new Date(lapsed.lastMembershipEndDate).toLocaleDateString()} - {lapsed.daysSinceLapsed} days ago
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            Purchase History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Membership End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lapsed.rawTransactions?.map((txn, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(txn.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{txn.cleanedProduct || txn.paymentItem}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(txn.paymentValue || 0)}</TableCell>
                    <TableCell>
                      {txn.secMembershipEndDate ? new Date(txn.secMembershipEndDate).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderTransactionList = (transactions: TransactionDetail[]) => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.paymentValue, 0);
    const totalDiscount = transactions.reduce((sum, t) => sum + t.discountAmount, 0);
    const totalMRP = transactions.reduce((sum, t) => sum + (t.mrpPostTax || t.mrpPreTax || 0), 0);
    const totalSavings = transactions.reduce((sum, t) => sum + (t.savings || 0), 0);
    const stackedCount = transactions.filter(t => t.isStacked).length;
    const avgAtv = transactions.length > 0 ? totalRevenue / transactions.length : 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatNumber(transactions.length)}</div>
              <div className="text-sm text-gray-600">Transactions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(avgAtv)}</div>
              <div className="text-sm text-gray-600">Avg ATV</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalDiscount)}</div>
              <div className="text-sm text-gray-600">Total Discounts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalSavings)}</div>
              <div className="text-sm text-gray-600">Total Savings</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>MRP</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn, index) => {
                    const mrp = txn.mrpPostTax || txn.mrpPreTax || 0;
                    const savings = txn.savings || (mrp > 0 ? mrp - txn.paymentValue : 0);
                    return (
                      <TableRow key={index}>
                        <TableCell>{new Date(txn.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{txn.customerName}</TableCell>
                        <TableCell className="max-w-xs truncate">{txn.product}</TableCell>
                        <TableCell className="text-gray-500">
                          {mrp > 0 ? formatCurrency(mrp) : '-'}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(txn.paymentValue)}</TableCell>
                        <TableCell>
                          {txn.discountAmount > 0 ? (
                            <span className="text-green-600">
                              {formatCurrency(txn.discountAmount)} ({formatPercentage(txn.discountPercentage)})
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {savings > 0 ? (
                            <span className="text-emerald-600 font-medium">
                              {formatCurrency(savings)}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {txn.isNew && <Badge variant="default" className="text-xs">New</Badge>}
                            {txn.isStacked && <Badge variant="secondary" className="text-xs">Stacked</Badge>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {data.title}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {data.type === 'spender' && data.spenderData && renderSpenderDetails(data.spenderData)}
          {data.type === 'lapsed' && data.lapsedData && renderLapsedDetails(data.lapsedData)}
          {(data.type === 'new-transactions' || data.type === 'repeat-transactions') && data.transactions && renderTransactionList(data.transactions)}
        </div>
      </DialogContent>
    </Dialog>
  );
};
