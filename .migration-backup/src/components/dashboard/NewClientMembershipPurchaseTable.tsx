import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, TrendingUp, X, Users, Calendar, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface NewClientMembershipPurchaseTableProps {
  data: NewClientData[];
}

interface DrillDownData {
  membershipType: string;
  clients: NewClientData[];
  stats: MembershipPurchaseStats;
  field: string;
  fieldLabel: string;
}

interface MembershipPurchaseStats {
  membershipType: string;
  clientType: string; // Moved from nested to top-level
  units: number; // Number of purchases
  newClientsCount: number; // Number of unique new clients who bought this
  totalRevenue: number;
  avgRevenue: number;
  avgDaysTaken: number; // Average conversion span
  avgVisitsPostTrial: number;
  avgLTV: number;
  totalLTV: number;
  clientTypes: Record<string, number>; // Kept for drill-down compatibility
}

export const NewClientMembershipPurchaseTable: React.FC<NewClientMembershipPurchaseTableProps> = ({ data }) => {
  const totalsRowStyle: React.CSSProperties = {
    ['--retention-totals-bg' as string]: '#9d174d',
    ['--retention-totals-text' as string]: '#ffffff',
    ['--retention-totals-border' as string]: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#9d174d',
    color: '#ffffff',
    borderTopColor: '#be185d',
  };

  const totalsCellStyle: React.CSSProperties = {
    ['--retention-totals-bg' as string]: '#9d174d',
    ['--retention-totals-text' as string]: '#ffffff',
    ['--retention-totals-border' as string]: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#9d174d',
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderTopColor: '#be185d',
  };

  const [sortField, setSortField] = React.useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [drillDownData, setDrillDownData] = React.useState<DrillDownData | null>(null);
  const [groupBy, setGroupBy] = React.useState<'detailed' | 'membership' | 'clientType'>('detailed');

  // Filter to only new clients
  const newClientsData = React.useMemo(() => {
    return data.filter(client => 
      String(client.isNew || '').toLowerCase().includes('new')
    );
  }, [data]);

  // Store client data by membership + client type combination for drill-down
  const membershipClientMap = React.useMemo(() => {
    const map: Record<string, NewClientData[]> = {};
    
    newClientsData.forEach(client => {
      const membership = client.membershipsBoughtPostTrial || 'No Membership Purchase';
      const memberships = membership.split(',').map(m => m.trim()).filter(m => m);
      const clientType = client.isNew || 'Unknown';
      
      if (memberships.length === 0 || membership === '') {
        const key = `No Membership Purchase|${clientType}`;
        if (!map[key]) map[key] = [];
        map[key].push(client);
        return;
      }
      
      memberships.forEach(mem => {
        const key = `${mem}|${clientType}`;
        if (!map[key]) map[key] = [];
        map[key].push(client);
      });
    });
    
    return map;
  }, [newClientsData]);

  const membershipPurchaseData = React.useMemo(() => {
    // Create a combined key structure: membership + client type
    const membershipStats: Record<string, {
      membershipType: string;
      clientType: string;
      units: number;
      clients: Set<string>;
      totalRevenue: number;
      conversionSpans: number[];
      visitsPostTrial: number[];
      ltvs: number[];
      convertedClients: number;
    }> = {};

    // Process each new client
    newClientsData.forEach(client => {
      const membership = client.membershipsBoughtPostTrial || 'No Membership Purchase';
      const memberships = membership.split(',').map(m => m.trim()).filter(m => m);
      const clientType = client.isNew || 'Unknown';
      
      // If no memberships bought, create a "No Purchase" entry
      if (memberships.length === 0 || membership === '') {
        const key = `No Membership Purchase|${clientType}`;
        if (!membershipStats[key]) {
          membershipStats[key] = {
            membershipType: 'No Membership Purchase',
            clientType,
            units: 0,
            clients: new Set(),
            totalRevenue: 0,
            conversionSpans: [],
            visitsPostTrial: [],
            ltvs: [],
            convertedClients: 0
          };
        }
        membershipStats[key].clients.add(client.memberId);
        membershipStats[key].ltvs.push(client.ltv || 0);
        membershipStats[key].visitsPostTrial.push(client.visitsPostTrial || 0);
        return;
      }

      // Process each membership purchased
      memberships.forEach(mem => {
        const key = `${mem}|${clientType}`;
        if (!membershipStats[key]) {
          membershipStats[key] = {
            membershipType: mem,
            clientType,
            units: 0,
            clients: new Set(),
            totalRevenue: 0,
            conversionSpans: [],
            visitsPostTrial: [],
            ltvs: [],
            convertedClients: 0
          };
        }

        membershipStats[key].units++; // Count each purchase
        membershipStats[key].clients.add(client.memberId);
        membershipStats[key].ltvs.push(client.ltv || 0);
        
        // Only add conversion span and visits if they converted
        if (client.conversionStatus === 'Converted') {
          membershipStats[key].convertedClients++;
          if (client.conversionSpan && client.conversionSpan > 0) {
            membershipStats[key].conversionSpans.push(client.conversionSpan);
          }
        }
        
        if (client.visitsPostTrial) {
          membershipStats[key].visitsPostTrial.push(client.visitsPostTrial);
        }
      });
    });

    // Calculate averages and format data
    const formattedData: MembershipPurchaseStats[] = Object.values(membershipStats).map((stats) => {
      const newClientsCount = stats.clients.size;
      const totalLTV = stats.ltvs.reduce((sum, ltv) => sum + ltv, 0);
      const avgLTV = newClientsCount > 0 ? totalLTV / newClientsCount : 0;
      
      // Use LTV as proxy for revenue since we don't have direct purchase amounts
      const totalRevenue = totalLTV;
      const avgRevenue = avgLTV;
      
      const avgDaysTaken = stats.conversionSpans.length > 0 
        ? stats.conversionSpans.reduce((sum, span) => sum + span, 0) / stats.conversionSpans.length 
        : 0;
      
      const avgVisitsPostTrial = stats.visitsPostTrial.length > 0
        ? stats.visitsPostTrial.reduce((sum, visits) => sum + visits, 0) / stats.visitsPostTrial.length
        : 0;

      return {
        membershipType: stats.membershipType,
        clientType: stats.clientType,
        units: stats.units,
        newClientsCount,
        totalRevenue,
        avgRevenue,
        avgDaysTaken,
        avgVisitsPostTrial,
        avgLTV,
        totalLTV,
        clientTypes: { [stats.clientType]: newClientsCount } // For backward compatibility
      };
    });

    // Filter out empty rows
    const filteredData = formattedData.filter(stat => stat.newClientsCount > 0);

    // Apply grouping based on selected mode
    if (groupBy === 'membership') {
      // Aggregate by membership type only
      const aggregated: Record<string, MembershipPurchaseStats> = {};
      filteredData.forEach(row => {
        if (!aggregated[row.membershipType]) {
          aggregated[row.membershipType] = {
            membershipType: row.membershipType,
            clientType: 'All Types',
            units: 0,
            newClientsCount: 0,
            totalRevenue: 0,
            avgRevenue: 0,
            avgDaysTaken: 0,
            avgVisitsPostTrial: 0,
            avgLTV: 0,
            totalLTV: 0,
            clientTypes: {}
          };
        }
        aggregated[row.membershipType].units += row.units;
        aggregated[row.membershipType].newClientsCount += row.newClientsCount;
        aggregated[row.membershipType].totalRevenue += row.totalRevenue;
        aggregated[row.membershipType].clientTypes[row.clientType] = (aggregated[row.membershipType].clientTypes[row.clientType] || 0) + row.newClientsCount;
      });
      
      // Calculate averages
      Object.values(aggregated).forEach(agg => {
        agg.avgRevenue = agg.newClientsCount > 0 ? agg.totalRevenue / agg.newClientsCount : 0;
        
        // Weighted averages
        const matchingRows = filteredData.filter(r => r.membershipType === agg.membershipType);
        const totalClients = matchingRows.reduce((sum, r) => sum + r.newClientsCount, 0);
        agg.avgDaysTaken = totalClients > 0
          ? matchingRows.reduce((sum, r) => sum + r.avgDaysTaken * r.newClientsCount, 0) / totalClients
          : 0;
        agg.avgVisitsPostTrial = totalClients > 0
          ? matchingRows.reduce((sum, r) => sum + r.avgVisitsPostTrial * r.newClientsCount, 0) / totalClients
          : 0;
      });
      
      return Object.values(aggregated).sort((a, b) => b.units - a.units);
    } else if (groupBy === 'clientType') {
      // Aggregate by client type only
      const aggregated: Record<string, MembershipPurchaseStats> = {};
      filteredData.forEach(row => {
        if (!aggregated[row.clientType]) {
          aggregated[row.clientType] = {
            membershipType: 'All Memberships',
            clientType: row.clientType,
            units: 0,
            newClientsCount: 0,
            totalRevenue: 0,
            avgRevenue: 0,
            avgDaysTaken: 0,
            avgVisitsPostTrial: 0,
            avgLTV: 0,
            totalLTV: 0,
            clientTypes: {}
          };
        }
        aggregated[row.clientType].units += row.units;
        aggregated[row.clientType].newClientsCount += row.newClientsCount;
        aggregated[row.clientType].totalRevenue += row.totalRevenue;
        aggregated[row.clientType].clientTypes[row.clientType] = aggregated[row.clientType].newClientsCount;
      });
      
      // Calculate averages
      Object.values(aggregated).forEach(agg => {
        agg.avgRevenue = agg.newClientsCount > 0 ? agg.totalRevenue / agg.newClientsCount : 0;
        
        // Weighted averages
        const matchingRows = filteredData.filter(r => r.clientType === agg.clientType);
        const totalClients = matchingRows.reduce((sum, r) => sum + r.newClientsCount, 0);
        agg.avgDaysTaken = totalClients > 0
          ? matchingRows.reduce((sum, r) => sum + r.avgDaysTaken * r.newClientsCount, 0) / totalClients
          : 0;
        agg.avgVisitsPostTrial = totalClients > 0
          ? matchingRows.reduce((sum, r) => sum + r.avgVisitsPostTrial * r.newClientsCount, 0) / totalClients
          : 0;
      });
      
      return Object.values(aggregated).sort((a, b) => b.units - a.units);
    } else {
      // Detailed view: sort by membership type, then client type
      return filteredData.sort((a, b) => {
        if (a.membershipType !== b.membershipType) {
          return a.membershipType.localeCompare(b.membershipType);
        }
        return a.clientType.localeCompare(b.clientType);
      });
    }
  }, [newClientsData, groupBy]);

  const handleCellClick = (row: MembershipPurchaseStats, field: string, fieldLabel: string) => {
    let clients: NewClientData[] = [];
    let title = '';
    
    if (groupBy === 'membership') {
      // Aggregate all clients for this membership across all client types
      clients = Object.entries(membershipClientMap)
        .filter(([key]) => key.startsWith(`${row.membershipType}|`))
        .flatMap(([, clientList]) => clientList);
      title = `${row.membershipType} (All Client Types)`;
    } else if (groupBy === 'clientType') {
      // Aggregate all clients of this type across all memberships
      clients = Object.entries(membershipClientMap)
        .filter(([key]) => key.endsWith(`|${row.clientType}`))
        .flatMap(([, clientList]) => clientList);
      title = `All Memberships (${row.clientType})`;
    } else {
      // Detailed view: use exact combination
      const key = `${row.membershipType}|${row.clientType}`;
      clients = membershipClientMap[key] || [];
      title = `${row.membershipType} (${row.clientType})`;
    }
    
    setDrillDownData({
      membershipType: title,
      clients,
      stats: row,
      field,
      fieldLabel
    });
  };

  const columns = React.useMemo(() => {
    const baseColumns = [
      ...(groupBy !== 'clientType' ? [{
        key: 'membershipType' as const,
        header: 'Membership Type',
        className: 'font-medium text-xs min-w-[200px]',
        sortable: true,
        render: (value: string, row: MembershipPurchaseStats) => (
          <span 
            className="text-sm font-medium text-slate-700 truncate cursor-pointer hover:text-indigo-600 hover:underline" 
            title={value}
            onClick={() => handleCellClick(row, 'membershipType', 'Membership Overview')}
          >
            {value}
          </span>
        )
      }] : []),
      ...(groupBy !== 'membership' ? [{
        key: 'clientType' as const,
        header: 'Client Type',
        className: 'font-medium text-xs min-w-[120px]',
        sortable: true,
        render: (value: string, row: MembershipPurchaseStats) => (
          <span 
            className="text-sm text-slate-600 cursor-pointer hover:text-indigo-600 hover:underline" 
            title={value}
            onClick={() => handleCellClick(row, 'clientType', 'Client Type Analysis')}
          >
            {value}
          </span>
        )
      }] : []),
    ];

    return [
      ...baseColumns,
      {
        key: 'units' as const,
      header: 'Units Sold',
      align: 'center' as const,
      sortable: true,
      render: (value: number, row: MembershipPurchaseStats) => (
        <span 
          className="text-sm font-medium text-slate-700 cursor-pointer hover:text-indigo-600 hover:underline"
          onClick={() => handleCellClick(row, 'units', 'Units Sold Analysis')}
        >
          {formatNumber(value)}
        </span>
      )
    },
    {
      key: 'newClientsCount' as const,
      header: 'Clients',
      align: 'center' as const,
      sortable: true,
      render: (value: number, row: MembershipPurchaseStats) => (
        <span 
          className="text-sm font-medium text-slate-700 cursor-pointer hover:text-indigo-600 hover:underline"
          onClick={() => handleCellClick(row, 'newClientsCount', 'Client Details')}
        >
          {formatNumber(value)}
        </span>
      )
    },
    {
      key: 'totalRevenue' as const,
      header: 'Total Value (LTV)',
      align: 'right' as const,
      sortable: true,
      render: (value: number, row: MembershipPurchaseStats) => (
        <span 
          className="text-sm font-medium text-slate-700 cursor-pointer hover:text-indigo-600 hover:underline"
          onClick={() => handleCellClick(row, 'totalRevenue', 'Revenue Breakdown')}
        >
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'avgRevenue' as const,
      header: 'Avg Value',
      align: 'right' as const,
      sortable: true,
      render: (value: number, row: MembershipPurchaseStats) => (
        <span 
          className="text-sm font-medium text-slate-700 cursor-pointer hover:text-indigo-600 hover:underline"
          onClick={() => handleCellClick(row, 'avgRevenue', 'Average Value Analysis')}
        >
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'avgDaysTaken' as const,
      header: 'Avg Days to Convert',
      align: 'center' as const,
      sortable: true,
      render: (value: number, row: MembershipPurchaseStats) => (
        <span 
          className="text-sm font-medium text-slate-700 cursor-pointer hover:text-indigo-600 hover:underline"
          onClick={() => handleCellClick(row, 'avgDaysTaken', 'Conversion Timeline')}
        >
          {value > 0 ? `${value.toFixed(1)} days` : 'N/A'}
        </span>
      )
    },
    {
      key: 'avgVisitsPostTrial' as const,
      header: 'Avg Visits',
      align: 'center' as const,
      sortable: true,
      render: (value: number, row: MembershipPurchaseStats) => (
        <span 
          className="text-sm font-medium text-slate-700 cursor-pointer hover:text-indigo-600 hover:underline"
          onClick={() => handleCellClick(row, 'avgVisitsPostTrial', 'Visit Patterns')}
        >
          {value.toFixed(1)}
        </span>
      )
    }
    ];
  }, [groupBy]);

  // Calculate totals
  const totals = React.useMemo(() => {
    const totalClients = membershipPurchaseData.reduce((sum, row) => sum + row.newClientsCount, 0);
    const totalRevenue = membershipPurchaseData.reduce((sum, row) => sum + row.totalRevenue, 0);
    const avgRevenue = totalClients > 0 ? totalRevenue / totalClients : 0;
    
    return {
      membershipType: 'TOTAL',
      clientType: 'All Types',
      units: membershipPurchaseData.reduce((sum, row) => sum + row.units, 0),
      newClientsCount: totalClients,
      clientTypes: {},
      totalRevenue,
      avgRevenue,
      avgDaysTaken: membershipPurchaseData.length > 0
        ? membershipPurchaseData.reduce((sum, row) => sum + row.avgDaysTaken * row.newClientsCount, 0) / totalClients
        : 0,
      avgVisitsPostTrial: totalClients > 0
        ? membershipPurchaseData.reduce((sum, row) => sum + row.avgVisitsPostTrial * row.newClientsCount, 0) / totalClients
        : 0,
      avgLTV: 0,
      totalLTV: 0
    };
  }, [membershipPurchaseData]);

  const displayedData = React.useMemo(() => {
    if (!sortField) return membershipPurchaseData;
    const arr = [...membershipPurchaseData];
    return arr.sort((a: any, b: any) => {
      const av = a[sortField];
      const bv = b[sortField];
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [membershipPurchaseData, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('desc'); }
  };

  // Calculate insights
  const insights = React.useMemo(() => {
    if (membershipPurchaseData.length === 0) return null;

    const topByUnits = [...membershipPurchaseData].sort((a, b) => b.units - a.units)[0];
    const topByRevenue = [...membershipPurchaseData].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
    const fastestConversion = [...membershipPurchaseData]
      .filter(m => m.avgDaysTaken > 0)
      .sort((a, b) => a.avgDaysTaken - b.avgDaysTaken)[0];

    // Helper to get display label
    const getLabel = (row: MembershipPurchaseStats) => {
      if (groupBy === 'membership') return row.membershipType;
      if (groupBy === 'clientType') return row.clientType;
      return `${row.membershipType} (${row.clientType})`;
    };

    return {
      topByUnits,
      topByRevenue,
      fastestConversion,
      getLabel
    };
  }, [membershipPurchaseData, groupBy]);

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white">
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <ShoppingCart className="w-5 h-5" />
          New Client Membership Purchases
          <Badge variant="secondary" className="bg-white/20 text-white">
            {newClientsData.length} New Clients
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {membershipPurchaseData.length} {groupBy === 'detailed' ? 'Rows' : groupBy === 'membership' ? 'Memberships' : 'Client Types'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {membershipPurchaseData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No membership purchase data available for new clients.
          </div>
        ) : (
          <>
            {/* Grouping Controls */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">Group By:</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={groupBy === 'detailed' ? 'default' : 'outline'}
                    onClick={() => setGroupBy('detailed')}
                    className={groupBy === 'detailed' ? 'bg-pink-600 hover:bg-pink-500 text-white border-pink-500' : 'border-pink-200 text-pink-700 hover:bg-pink-50'}
                  >
                    Detailed View
                  </Button>
                  <Button
                    size="sm"
                    variant={groupBy === 'membership' ? 'default' : 'outline'}
                    onClick={() => setGroupBy('membership')}
                    className={groupBy === 'membership' ? 'bg-pink-600 hover:bg-pink-500 text-white border-pink-500' : 'border-pink-200 text-pink-700 hover:bg-pink-50'}
                  >
                    By Membership
                  </Button>
                  <Button
                    size="sm"
                    variant={groupBy === 'clientType' ? 'default' : 'outline'}
                    onClick={() => setGroupBy('clientType')}
                    className={groupBy === 'clientType' ? 'bg-pink-600 hover:bg-pink-500 text-white border-pink-500' : 'border-pink-200 text-pink-700 hover:bg-pink-50'}
                  >
                    By Client Type
                  </Button>
                </div>
                <span className="text-xs text-slate-500 ml-auto">
                  {groupBy === 'detailed' && 'Showing all membership + client type combinations'}
                  {groupBy === 'membership' && 'Aggregated by membership type across all client types'}
                  {groupBy === 'clientType' && 'Aggregated by client type across all memberships'}
                </span>
              </div>
            </div>

            <div className="overflow-auto" style={{ maxHeight: '600px' }} data-table="client-retention-new-client-purchases" data-table-name="New Client Membership Purchases">
              <table className="w-full border-collapse" data-table="client-retention-new-client-purchases" data-table-name="New Client Membership Purchases">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-950 text-white">
                    {groupBy !== 'clientType' && (
                      <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-700" style={{ width: '300px', minWidth: '300px', maxHeight: '35px' }}>
                        Membership Type
                      </th>
                    )}
                    {groupBy !== 'membership' && (
                      <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-700" style={{ width: '100px', minWidth: '100px', maxHeight: '35px' }}>
                        Client Type
                      </th>
                    )}
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-700" style={{ width: '100px', minWidth: '100px', maxHeight: '35px' }}>
                      Units
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-700" style={{ width: '100px', minWidth: '100px', maxHeight: '35px' }}>
                      Clients
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-700" style={{ width: '100px', minWidth: '100px', maxHeight: '35px' }}>
                      Total Value
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-700" style={{ width: '100px', minWidth: '100px', maxHeight: '35px' }}>
                      Avg Value
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider border-r border-slate-700" style={{ width: '100px', minWidth: '100px', maxHeight: '35px' }}>
                      Avg Days
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ width: '100px', minWidth: '100px', maxHeight: '35px' }}>
                      Avg Visits
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-slate-50 transition-colors" style={{ maxHeight: '35px' }}>
                      {groupBy !== 'clientType' && (
                        <td className="py-2 px-3 text-sm text-slate-700 font-medium border-r border-gray-200 cursor-pointer hover:text-indigo-600 hover:underline truncate" 
                            style={{ maxHeight: '35px' }}
                            onClick={() => handleCellClick(row, 'membershipType', 'Membership Overview')}>
                          {row.membershipType}
                        </td>
                      )}
                      {groupBy !== 'membership' && (
                        <td className="py-2 px-3 text-sm text-slate-600 border-r border-gray-200 cursor-pointer hover:text-indigo-600 hover:underline truncate" 
                            style={{ maxHeight: '35px' }}
                            onClick={() => handleCellClick(row, 'clientType', 'Client Type Analysis')}>
                          {row.clientType}
                        </td>
                      )}
                      <td className="py-2 px-3 text-sm text-center text-slate-700 border-r border-gray-200 cursor-pointer hover:text-indigo-600 hover:underline" 
                          style={{ maxHeight: '35px' }}
                          onClick={() => handleCellClick(row, 'units', 'Units Sold Analysis')}>
                        {formatNumber(row.units)}
                      </td>
                      <td className="py-2 px-3 text-sm text-center text-slate-700 border-r border-gray-200 cursor-pointer hover:text-indigo-600 hover:underline" 
                          style={{ maxHeight: '35px' }}
                          onClick={() => handleCellClick(row, 'newClientsCount', 'Client Details')}>
                        {formatNumber(row.newClientsCount)}
                      </td>
                      <td className="py-2 px-3 text-sm text-right text-slate-700 font-medium border-r border-gray-200 cursor-pointer hover:text-indigo-600 hover:underline" 
                          style={{ maxHeight: '35px' }}
                          onClick={() => handleCellClick(row, 'totalRevenue', 'Revenue Breakdown')}>
                        {formatCurrency(row.totalRevenue)}
                      </td>
                      <td className="py-2 px-3 text-sm text-right text-slate-700 border-r border-gray-200 cursor-pointer hover:text-indigo-600 hover:underline" 
                          style={{ maxHeight: '35px' }}
                          onClick={() => handleCellClick(row, 'avgRevenue', 'Average Value Analysis')}>
                        {formatCurrency(row.avgRevenue)}
                      </td>
                      <td className="py-2 px-3 text-sm text-center text-slate-700 border-r border-gray-200 cursor-pointer hover:text-indigo-600 hover:underline" 
                          style={{ maxHeight: '35px' }}
                          onClick={() => handleCellClick(row, 'avgDaysTaken', 'Conversion Timeline')}>
                        {row.avgDaysTaken > 0 ? `${row.avgDaysTaken.toFixed(1)}` : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-sm text-center text-slate-700 cursor-pointer hover:text-indigo-600 hover:underline" 
                          style={{ maxHeight: '35px' }}
                          onClick={() => handleCellClick(row, 'avgVisitsPostTrial', 'Visit Patterns')}>
                        {row.avgVisitsPostTrial.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="retention-totals-row border-t-4 border-pink-700 font-bold" style={{ ...totalsRowStyle, maxHeight: '35px' }}>
                    {groupBy !== 'clientType' && (
                      <td className="border-r py-2 px-3 text-sm" style={{ ...totalsCellStyle, maxHeight: '35px' }}>
                        {totals.membershipType}
                      </td>
                    )}
                    {groupBy !== 'membership' && (
                      <td className="border-r py-2 px-3 text-sm" style={{ ...totalsCellStyle, maxHeight: '35px' }}>
                        {totals.clientType}
                      </td>
                    )}
                    <td className="border-r py-2 px-3 text-sm text-center" style={{ ...totalsCellStyle, maxHeight: '35px' }}>
                      {formatNumber(totals.units)}
                    </td>
                    <td className="border-r py-2 px-3 text-sm text-center" style={{ ...totalsCellStyle, maxHeight: '35px' }}>
                      {formatNumber(totals.newClientsCount)}
                    </td>
                    <td className="border-r py-2 px-3 text-sm text-right font-semibold" style={{ ...totalsCellStyle, maxHeight: '35px' }}>
                      {formatCurrency(totals.totalRevenue)}
                    </td>
                    <td className="border-r py-2 px-3 text-sm text-right" style={{ ...totalsCellStyle, maxHeight: '35px' }}>
                      {formatCurrency(totals.avgRevenue)}
                    </td>
                    <td className="border-r py-2 px-3 text-sm text-center" style={{ ...totalsCellStyle, maxHeight: '35px' }}>
                      {totals.avgDaysTaken > 0 ? totals.avgDaysTaken.toFixed(1) : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-center" style={{ ...totalsCellStyle, maxHeight: '35px' }}>
                      {totals.avgVisitsPostTrial.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {insights && (
              <div className="border-t border-slate-200 p-6 bg-slate-50">
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-700" />
                  Key Insights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">Most Popular</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {insights.getLabel(insights.topByUnits)}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {formatNumber(insights.topByUnits.units)} units sold to {formatNumber(insights.topByUnits.newClientsCount)} clients
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">Highest Revenue</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {insights.getLabel(insights.topByRevenue)}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {formatCurrency(insights.topByRevenue.totalRevenue)} total value
                    </p>
                  </div>
                  
                  {insights.fastestConversion && (
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">Fastest Conversion</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {insights.getLabel(insights.fastestConversion)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Avg {insights.fastestConversion.avgDaysTaken.toFixed(1)} days to convert
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This table shows memberships purchased by new clients post-trial. 
                    "Units Sold" represents the total number of membership purchases, while "New Clients" shows unique buyers. 
                    Values are based on client LTV. Average days to convert is calculated only for clients who completed conversion.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Drill-Down Modal */}
      <Dialog open={!!drillDownData} onOpenChange={() => setDrillDownData(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto border border-slate-200 bg-white shadow-2xl">
          {drillDownData && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <ShoppingCart className="w-6 h-6 text-slate-700" />
                  {drillDownData.fieldLabel} - {drillDownData.membershipType}
                </DialogTitle>
                <DialogDescription>
                  Detailed analysis and client breakdown for this membership type
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-slate-700" />
                      <p className="text-xs font-medium text-slate-700">Total Clients</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(drillDownData.stats.newClientsCount)}</p>
                    <p className="text-xs text-slate-600 mt-1">{formatNumber(drillDownData.stats.units)} units sold</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-slate-700" />
                      <p className="text-xs font-medium text-slate-700">Total Value</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(drillDownData.stats.totalRevenue)}</p>
                    <p className="text-xs text-slate-600 mt-1">{formatCurrency(drillDownData.stats.avgRevenue)} avg per client</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-slate-700" />
                      <p className="text-xs font-medium text-slate-700">Conversion Time</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {drillDownData.stats.avgDaysTaken > 0 ? `${drillDownData.stats.avgDaysTaken.toFixed(1)}` : 'N/A'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">days average</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-slate-700" />
                      <p className="text-xs font-medium text-slate-700">Conversion Rate</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{drillDownData.stats.avgVisitsPostTrial.toFixed(1)}</p>
                    <p className="text-xs text-slate-600 mt-1">avg visits post-trial</p>
                  </div>
                </div>

                {/* Client Type Info */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-700" />
                    Client Segment
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-slate-900 font-bold">{drillDownData.stats.clientType}</span>
                    <span className="text-sm text-slate-600">{drillDownData.clients.length} clients (100%)</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    All clients in this analysis belong to the same type segment for targeted insights.
                  </p>
                </div>

                {/* Contextual Analysis */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-700" />
                    Contextual Insights
                  </h4>
                  <div className="space-y-3 text-sm text-slate-700">
                    {drillDownData.field === 'membershipType' && (
                      <>
                        <p>• This membership has been purchased by <strong>{drillDownData.clients.length}</strong> unique new clients, generating a total LTV of <strong>{formatCurrency(drillDownData.stats.totalRevenue)}</strong>.</p>
                        <p>• On average, clients visit <strong>{drillDownData.stats.avgVisitsPostTrial.toFixed(1)}</strong> times post-trial before making their purchase decision.</p>
                        {drillDownData.stats.avgDaysTaken > 0 && (
                          <p>• The conversion timeline averages <strong>{drillDownData.stats.avgDaysTaken.toFixed(1)} days</strong>, suggesting {drillDownData.stats.avgDaysTaken <= 14 ? 'quick decision-making' : drillDownData.stats.avgDaysTaken <= 30 ? 'moderate consideration time' : 'extended evaluation period'}.</p>
                        )}
                      </>
                    )}
                    {drillDownData.field === 'units' && (
                      <>
                        <p>• A total of <strong>{drillDownData.stats.units}</strong> units of this membership have been sold to <strong>{drillDownData.clients.length}</strong> new clients.</p>
                        <p>• This represents an average of <strong>{(drillDownData.stats.units / drillDownData.clients.length).toFixed(2)}</strong> purchases per client, indicating {(drillDownData.stats.units / drillDownData.clients.length) > 1 ? 'multiple purchases or renewals' : 'single purchase behavior'}.</p>
                        <p>• The membership is generating <strong>{formatCurrency(drillDownData.stats.avgRevenue)}</strong> in average value per client.</p>
                      </>
                    )}
                    {drillDownData.field === 'newClientsCount' && (
                      <>
                        <p>• <strong>{drillDownData.clients.length}</strong> clients of type <strong>{drillDownData.stats.clientType}</strong> have chosen this membership since their trial period.</p>
                        <p>• Client distribution: {drillDownData.clients.filter(c => c.conversionStatus === 'Converted').length} converted, {drillDownData.clients.filter(c => c.retentionStatus === 'Retained').length} retained.</p>
                        <p>• All clients in this segment are classified as: <strong>{drillDownData.stats.clientType}</strong></p>
                        <p>• Popular locations: {(() => {
                          const locations = drillDownData.clients.reduce((acc, c) => {
                            const loc = c.homeLocation || 'Unknown';
                            acc[loc] = (acc[loc] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          const topLoc = Object.entries(locations).sort((a, b) => b[1] - a[1])[0];
                          return `${topLoc?.[0]} (${topLoc?.[1]} clients)`;
                        })()}</p>
                      </>
                    )}
                    {drillDownData.field === 'clientType' && (
                      <>
                        <p>• This segment represents <strong>{drillDownData.stats.clientType}</strong> clients who purchased <strong>{drillDownData.stats.membershipType}</strong>.</p>
                        <p>• Segment size: <strong>{drillDownData.clients.length}</strong> clients generating {formatCurrency(drillDownData.stats.totalRevenue)} in total value.</p>
                        <p>• Average value per client: <strong>{formatCurrency(drillDownData.stats.avgRevenue)}</strong> with {drillDownData.stats.avgVisitsPostTrial.toFixed(1)} average visits.</p>
                        <p>• Engagement status: {drillDownData.clients.filter(c => c.conversionStatus === 'Converted').length} converted clients, {drillDownData.clients.filter(c => c.retentionStatus === 'Retained').length} retained</p>
                        <p>• Client type insight: {(() => {
                          const type = drillDownData.stats.clientType.toLowerCase();
                          if (type.includes('new')) return 'New clients typically show higher engagement and are building their relationship with the studio.';
                          if (type.includes('return') || type.includes('existing')) return 'Returning clients demonstrate loyalty and familiarity with the studio offerings.';
                          return 'This client segment shows unique engagement patterns worth monitoring.';
                        })()}</p>
                      </>
                    )}
                    {drillDownData.field === 'totalRevenue' && (
                      <>
                        <p>• Total lifetime value from this membership: <strong>{formatCurrency(drillDownData.stats.totalRevenue)}</strong></p>
                        <p>• Revenue distribution: {formatCurrency(drillDownData.stats.avgRevenue)} average per client with {drillDownData.clients.length} contributing clients.</p>
                        <p>• Top contributors: {(() => {
                          const sorted = [...drillDownData.clients].sort((a, b) => (b.ltv || 0) - (a.ltv || 0));
                          const top3 = sorted.slice(0, 3);
                          const topRevenue = top3.reduce((sum, c) => sum + (c.ltv || 0), 0);
                          const percentage = drillDownData.stats.totalRevenue > 0 ? (topRevenue / drillDownData.stats.totalRevenue) * 100 : 0;
                          return `Top 3 clients contribute ${formatPercentage(percentage)}`;
                        })()}</p>
                      </>
                    )}
                    {drillDownData.field === 'avgRevenue' && (
                      <>
                        <p>• Average client value: <strong>{formatCurrency(drillDownData.stats.avgRevenue)}</strong></p>
                        <p>• Value range: {formatCurrency(Math.min(...drillDownData.clients.map(c => c.ltv || 0)))} to {formatCurrency(Math.max(...drillDownData.clients.map(c => c.ltv || 0)))}</p>
                        <p>• Median value: <strong>{formatCurrency((() => {
                          const sorted = [...drillDownData.clients].map(c => c.ltv || 0).sort((a, b) => a - b);
                          return sorted[Math.floor(sorted.length / 2)];
                        })())}</strong>, indicating {(() => {
                          const median = [...drillDownData.clients].map(c => c.ltv || 0).sort((a, b) => a - b)[Math.floor(drillDownData.clients.length / 2)];
                          return drillDownData.stats.avgRevenue > median * 1.2 ? 'some high-value outliers' : 'balanced distribution';
                        })()}</p>
                      </>
                    )}
                    {drillDownData.field === 'avgDaysTaken' && (
                      <>
                        <p>• Average conversion time: <strong>{drillDownData.stats.avgDaysTaken > 0 ? `${drillDownData.stats.avgDaysTaken.toFixed(1)} days` : 'Not available'}</strong></p>
                        {drillDownData.stats.avgDaysTaken > 0 && (
                          <>
                            <p>• Fastest conversion: {Math.min(...drillDownData.clients.filter(c => c.conversionSpan > 0).map(c => c.conversionSpan))} days | Slowest: {Math.max(...drillDownData.clients.filter(c => c.conversionSpan > 0).map(c => c.conversionSpan))} days</p>
                            <p>• {drillDownData.clients.filter(c => c.conversionSpan > 0 && c.conversionSpan <= 7).length} clients ({formatPercentage((drillDownData.clients.filter(c => c.conversionSpan > 0 && c.conversionSpan <= 7).length / drillDownData.clients.filter(c => c.conversionSpan > 0).length) * 100)}) converted within first week</p>
                            <p>• Sales cycle insight: {drillDownData.stats.avgDaysTaken <= 14 ? 'Short decision cycle - effective for immediate promotions' : drillDownData.stats.avgDaysTaken <= 30 ? 'Moderate consideration - nurture campaigns recommended' : 'Long evaluation - focus on building trust and value demonstration'}</p>
                          </>
                        )}
                      </>
                    )}
                    {drillDownData.field === 'avgVisitsPostTrial' && (
                      <>
                        <p>• Average visits post-trial: <strong>{drillDownData.stats.avgVisitsPostTrial.toFixed(1)}</strong></p>
                        <p>• Visit distribution: {drillDownData.clients.filter(c => (c.visitsPostTrial || 0) >= drillDownData.stats.avgVisitsPostTrial).length} clients above average, {drillDownData.clients.filter(c => (c.visitsPostTrial || 0) < drillDownData.stats.avgVisitsPostTrial).length} below</p>
                        <p>• Engagement pattern: {drillDownData.stats.avgVisitsPostTrial >= 10 ? 'High engagement - clients are actively trying the service before committing' : drillDownData.stats.avgVisitsPostTrial >= 5 ? 'Moderate engagement - healthy trial period utilization' : 'Quick decision - minimal trial needed before purchase'}</p>
                      </>
                    )}
                    {drillDownData.field === 'clientType' && (
                      <>
                        <p>• Client type: <strong>{drillDownData.stats.clientType}</strong> ({drillDownData.clients.length} clients)</p>
                        <p>• Conversion status: {drillDownData.clients.filter(c => c.conversionStatus === 'Converted').length} converted clients</p>
                        <p>• Retention correlation: {drillDownData.clients.filter(c => c.retentionStatus === 'Retained').length} clients ({formatPercentage((drillDownData.clients.filter(c => c.retentionStatus === 'Retained').length / drillDownData.clients.length) * 100)}) are retained, indicating {(drillDownData.clients.filter(c => c.retentionStatus === 'Retained').length / drillDownData.clients.length) >= 0.5 ? 'strong long-term engagement' : 'potential retention challenges'}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Client List */}
                <div className="bg-white border border-slate-200 rounded-lg">
                  <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-800">Client Details ({drillDownData.clients.length} clients)</h4>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Client</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Client Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Location</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-600">LTV</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-600">Visits</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-600">Days to Convert</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {drillDownData.clients.map((client, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-700">
                              <div className="font-medium">{client.firstName} {client.lastName}</div>
                              <div className="text-xs text-slate-500">{client.email}</div>
                            </td>
                            <td className="px-4 py-2 text-slate-600 text-xs">{client.isNew || 'Unknown'}</td>
                            <td className="px-4 py-2 text-slate-600">{client.homeLocation || 'N/A'}</td>
                            <td className="px-4 py-2 text-center text-slate-700 font-medium">{formatCurrency(client.ltv || 0)}</td>
                            <td className="px-4 py-2 text-center text-slate-700">{client.visitsPostTrial || 0}</td>
                            <td className="px-4 py-2 text-center text-slate-700">{client.conversionSpan > 0 ? `${client.conversionSpan} days` : 'N/A'}</td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-slate-600">{client.conversionStatus}</span>
                                <span className="text-xs text-slate-600">{client.retentionStatus}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button onClick={() => setDrillDownData(null)} variant="outline">
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
