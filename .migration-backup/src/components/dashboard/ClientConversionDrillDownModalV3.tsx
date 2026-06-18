import React from 'react';
import { logger } from '@/utils/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { TrendingUp, Users, BarChart3, DollarSign, Target, Star, Zap, X, Download, Copy, LayoutGrid, List } from 'lucide-react';
import { NewClientData } from '@/types/dashboard';

type DrillDownModalType = 'month' | 'year' | 'class' | 'membership' | 'metric' | 'ranking';

type DrillDownDataPayload = {
  clients?: NewClientData[];
  relatedClients?: NewClientData[];
  metricType?: string;
  [key: string]: unknown;
};

interface ClientConversionDrillDownModalV3Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: DrillDownDataPayload | NewClientData[] | null;
  type: DrillDownModalType;
}
export const ClientConversionDrillDownModalV3: React.FC<ClientConversionDrillDownModalV3Props> = ({
  isOpen,
  onClose,
  title,
  data,
  type
}) => {
  // Local UI state for premium interactions
  const [quickFilter, setQuickFilter] = React.useState<'all' | 'new' | 'converted' | 'retained' | 'highLTV'>('all');
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');
  const [search, setSearch] = React.useState('');
  const hasData = Boolean(data);
  const payload = data && !Array.isArray(data) ? data : null;
  const metricType = typeof payload?.metricType === 'string' ? payload.metricType : '';

  // Extract targeted client data based on type and drill-down context
  const clients: NewClientData[] = React.useMemo(() => {
    if (!hasData) return [];

    // For ranking drill-downs, use the relatedClients array
    if (type === 'ranking' && payload?.relatedClients && Array.isArray(payload.relatedClients)) {
      logger.debug('Drill-down V3: Using ranking related clients:', payload.relatedClients.length);
      return payload.relatedClients;
    }

    // For metric card clicks, use the filtered clients array
    if (type === 'metric' && payload?.clients && Array.isArray(payload.clients)) {
      logger.debug('Drill-down V3: Using metric card filtered clients:', payload.clients.length, 'MetricType:', metricType);
      return payload.clients;
    }

    // For month/year table row clicks, use the clients array from the row data
    if ((type === 'month' || type === 'year') && payload?.clients && Array.isArray(payload.clients)) {
      logger.debug('Drill-down V3: Using table row clients:', payload.clients.length);
      return payload.clients;
    }

    // For other table types, check if data has clients property
    if (payload?.clients && Array.isArray(payload.clients)) {
      logger.debug('Drill-down V3: Using generic clients array:', payload.clients.length);
      return payload.clients;
    }

    // For direct array format
    if (Array.isArray(data)) {
      logger.debug('Drill-down V3: Using direct array data:', data.length);
      return data;
    }

    // Fallback to empty array
    logger.debug('Drill-down V3: No targeted clients found, showing empty. Data structure:', Object.keys(payload || {}));
    return [];
  }, [data, hasData, metricType, payload, type]);

  // Calculate summary metrics from targeted clients
  const summary = React.useMemo(() => {
    const totalMembers = clients.length;
    
    // New members: match the exact logic from metric cards - where isNew contains "new" (case insensitive)
    const newMembers = clients.filter(c => {
      const isNewValue = String(c.isNew || '').toLowerCase();
      return isNewValue.includes('new');
    }).length;
    
    // Converted members: those with exact conversionStatus "Converted"
    const convertedMembers = clients.filter(c => (c.conversionStatus || '').trim() === 'Converted').length;
    
    // Retained members: those with exact retentionStatus "Retained"
    const retainedMembers = clients.filter(c => (c.retentionStatus || '').trim() === 'Retained').length;
    
    const totalLTV = clients.reduce((sum, c) => sum + (c.ltv || 0), 0);
    const totalConversionSpan = clients.filter(c => c.conversionSpan > 0).reduce((sum, c) => sum + (c.conversionSpan || 0), 0);
    const clientsWithConversionData = clients.filter(c => c.conversionSpan > 0).length;
    
    // Debug logging to understand the data
    logger.debug('Modal Summary Calculation (Updated Logic):', {
      totalMembers,
      newMembers,
      convertedMembers,
      retainedMembers,
      metricType,
      sampleIsNewValues: clients.slice(0, 5).map(c => c.isNew),
      sampleConversionStatus: clients.slice(0, 5).map(c => c.conversionStatus),
      sampleRetentionStatus: clients.slice(0, 5).map(c => c.retentionStatus),
      filteredNewMembersCheck: clients.filter(c => {
        const isNewValue = String(c.isNew || '').toLowerCase();
        return isNewValue.includes('new');
      }).length
    });
    
    return {
      totalMembers,
      newMembers,
      convertedMembers,
      retainedMembers,
      conversionRate: totalMembers > 0 ? (convertedMembers / totalMembers) * 100 : 0, // Conversion rate within this subset
      retentionRate: totalMembers > 0 ? (retainedMembers / totalMembers) * 100 : 0, // Retention rate within this subset
      avgLTV: totalMembers > 0 ? totalLTV / totalMembers : 0,
      totalLTV,
      avgConversionTime: clientsWithConversionData > 0 ? totalConversionSpan / clientsWithConversionData : 0
    };
  }, [clients, metricType]);

  // Apply local quick filters and search within the modal scope
  const displayedClients = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    let arr = clients;
    if (quickFilter === 'new') {
      arr = arr.filter(c => (String(c.isNew || '').toLowerCase().includes('new')));
    } else if (quickFilter === 'converted') {
      arr = arr.filter(c => (c.conversionStatus || '').trim() === 'Converted');
    } else if (quickFilter === 'retained') {
      arr = arr.filter(c => (c.retentionStatus || '').trim() === 'Retained');
    } else if (quickFilter === 'highLTV') {
      // Heuristic threshold for high LTV
      const values = arr.map(c => c.ltv || 0).sort((a,b)=>a-b);
      const p75 = values.length ? values[Math.floor(0.75 * (values.length - 1))] : 0;
      arr = arr.filter(c => (c.ltv || 0) >= p75);
    }
    if (term) {
      arr = arr.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(term) || (c.email || '').toLowerCase().includes(term));
    }
    return arr;
  }, [clients, quickFilter, search]);

  // Small helpers for actions
  const exportCSV = React.useCallback((rows: NewClientData[]) => {
    if (!rows || rows.length === 0) return;
    const headers = ['First Name','Last Name','Email','Is New','Conversion Status','Retention Status','LTV','First Visit Date','First Visit Location','Home Location','Trainer'];
    const lines = rows.map(r => [
      r.firstName || '', r.lastName || '', r.email || '', r.isNew || '', r.conversionStatus || '', r.retentionStatus || '',
      String(r.ltv ?? ''), r.firstVisitDate || '', r.firstVisitLocation || '', r.homeLocation || '', r.trainerName || ''
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g,'-').toLowerCase()}-clients.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [title]);

  const copyEmails = React.useCallback((rows: NewClientData[]) => {
    const emails = rows.map(r => r.email).filter(Boolean).join(', ');
    if (!emails) return;
    navigator.clipboard.writeText(emails);
  }, []);
  const renderMetricCards = () => {
    const isConvertedDrillDown = metricType === 'converted_members';
    const isRetainedDrillDown = metricType === 'retained_members';

    const newMembersLabel = isConvertedDrillDown
      ? 'New → Converted'
      : isRetainedDrillDown
      ? 'New → Retained'
      : 'New Members';

    const conversionRateLabel = isConvertedDrillDown || isRetainedDrillDown ? 'Subset Conv. Rate' : 'Conversion Rate';

    const cards = [
      {
        label: 'Total Members',
        value: formatNumber(summary.totalMembers),
        icon: Users,
      },
      {
        label: newMembersLabel,
        value: formatNumber(summary.newMembers),
        icon: Target,
      },
      {
        label: 'Converted',
        value: formatNumber(summary.convertedMembers),
        icon: Star,
      },
      {
        label: conversionRateLabel,
        value: `${summary.conversionRate.toFixed(1)}%`,
        icon: TrendingUp,
      },
      {
        label: 'Avg LTV',
        value: formatCurrency(summary.avgLTV),
        icon: DollarSign,
        sub: `Total: ${formatCurrency(summary.totalLTV)}`,
      },
    ];

    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-slate-900">{card.value}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</div>
                {card.sub && <div className="mt-1 text-[11px] text-slate-500">{card.sub}</div>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };
  const renderClientTable = () => {
    if (clients.length === 0) {
      return <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No client data available for this selection.</p>
          </CardContent>
        </Card>;
    }
    return <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Client Details ({formatNumber(displayedClients.length)} of {formatNumber(clients.length)})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => exportCSV(displayedClients)} className="gap-1">
                <Download className="w-4 h-4" /> Export
              </Button>
              <Button variant="ghost" size="sm" onClick={() => copyEmails(displayedClients)} className="gap-1">
                <Copy className="w-4 h-4" /> Emails
              </Button>
            </div>
          </div>
          {/* Toolbar */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-full bg-slate-100 p-1">
              {(['all','new','converted','retained','highLTV'] as const).map(q => (
                <button key={q} onClick={() => setQuickFilter(q)} className={`px-3 py-1.5 text-xs rounded-full transition-all ${quickFilter===q? 'bg-slate-900 shadow text-white font-medium' : 'text-slate-600'}`}>
                  {q==='all'?'All': q==='new'?'New': q==='converted'?'Converted': q==='retained'?'Retained':'High LTV'}
                </button>
              ))}
            </div>
            <div className="relative ml-auto">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email" className="h-9 w-56 rounded-full border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200" />
            </div>
            <div className="inline-flex rounded-full bg-slate-100 p-1">
              <button onClick={()=>setViewMode('table')} className={`px-2 py-1.5 rounded-full ${viewMode==='table'?'bg-slate-900 shadow text-white':''}`} title="Table View">
                <List className="w-4 h-4" />
              </button>
              <button onClick={()=>setViewMode('cards')} className={`px-2 py-1.5 rounded-full ${viewMode==='cards'?'bg-slate-900 shadow text-white':''}`} title="Card View">
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode==='table' ? (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-900">
                  <TableRow className="bg-slate-900 border-slate-700">
                    <TableHead className="font-semibold text-slate-100 text-xs px-3">Name</TableHead>
                    <TableHead className="font-semibold text-slate-100 text-xs px-3">Email</TableHead>
                    <TableHead className="font-semibold text-slate-100 text-xs px-3">Trainer</TableHead>
                    <TableHead className="font-semibold text-slate-100 text-xs px-3">Class No</TableHead>
                    <TableHead className="font-semibold text-slate-100 text-xs px-3">Membership</TableHead>
                    <TableHead className="font-semibold text-slate-100 text-xs px-3">First Visit Date</TableHead>
                    <TableHead className="font-semibold text-slate-100 text-xs px-3">First Visit Location</TableHead>
                    <TableHead className="font-semibold text-slate-100 text-xs px-3">First Visit Entity</TableHead>
                    <TableHead className="font-semibold text-slate-100 text-xs px-3">Conversion Status</TableHead>
                    <TableHead className="font-semibold text-slate-100 text-xs px-3">First Purchase Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedClients.slice(0, 200).map((client, index) => (
                    <TableRow key={index} className="compact-table-row hover:bg-gray-50 transition-colors">
                      <TableCell className="text-xs px-3 font-medium text-slate-800">
                        {client.firstName} {client.lastName}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-gray-600 truncate max-w-[200px]" title={client.email}>
                        {client.email}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-slate-700 truncate max-w-[160px]" title={client.trainerName}>
                        {client.trainerName || '—'}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-center text-slate-700">
                        {client.classNo ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-slate-700">
                        {client.membershipUsed || '—'}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-slate-700">
                        {client.firstVisitDate || '—'}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-slate-700 truncate max-w-[160px]" title={client.firstVisitLocation}>
                        {client.firstVisitLocation || '—'}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-slate-700">
                        {client.firstVisitEntityName || '—'}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-slate-700">
                        {client.conversionStatus || '—'}
                      </TableCell>
                      <TableCell className="text-xs px-3 text-slate-700">
                        {client.firstPurchase || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {displayedClients.length > 200 && (
                <div className="p-4 text-center text-sm text-gray-600">
                  Showing 200 of {displayedClients.length} clients.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {displayedClients.map((client, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-800 text-sm truncate max-w-[70%]">{client.firstName} {client.lastName}</div>
                    <div className="text-xs font-semibold text-slate-700">{formatCurrency(client.ltv || 0)}</div>
                  </div>
                  <div className="text-xs text-slate-600 truncate" title={client.email}>{client.email}</div>
                  <div className="mt-2 text-xs text-slate-700 space-y-1">
                    <div><strong>Trainer:</strong> {client.trainerName || '—'}</div>
                    <div><strong>Class No:</strong> {client.classNo ?? '—'}</div>
                    <div><strong>Location:</strong> {client.firstVisitLocation || '—'}</div>
                    <div><strong>Membership:</strong> {client.membershipUsed || '—'}</div>
                    <div><strong>Conversion:</strong> {client.conversionStatus || '—'}</div>
                    <div><strong>Retention:</strong> {client.retentionStatus || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>;
  };

  if (!hasData) return null;

  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[1400px] max-h-[90vh] overflow-hidden p-0 bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="-m-6 mb-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-6 pb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                {title} - Detailed Analysis
              </DialogTitle>
              <p className="mt-2 text-sm text-slate-300">
                Targeted client conversion and retention analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="border-white/30 bg-white/20 text-white backdrop-blur-sm">
                {type === 'month' ? 'Monthly' : type === 'year' ? 'Yearly' : type === 'metric' ? 'Metric Analysis' : 'Analytics'}
              </Badge>
              <Badge className="border-white/30 bg-white/20 text-white backdrop-blur-sm">
                {formatNumber(displayedClients.length)} of {formatNumber(clients.length)}
              </Badge>
              <div className="flex items-center gap-2">
                <Button size="sm" className="bg-white font-medium text-slate-900 hover:bg-slate-100" onClick={() => exportCSV(displayedClients)}>
                  <Download className="w-4 h-4 mr-1" /> Export
                </Button>
                <Button size="sm" className="bg-white font-medium text-slate-900 hover:bg-slate-100" onClick={() => copyEmails(displayedClients)}>
                  <Copy className="w-4 h-4 mr-1" /> Emails
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto px-8 py-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          
          {/* Key Metrics Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-4 text-lg font-semibold text-slate-800">
              <BarChart3 className="h-5 w-5 text-slate-700" />
              Key Performance Metrics
            </h3>
            {renderMetricCards()}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid h-14 w-full grid-cols-3 rounded-lg border border-slate-200 bg-slate-50 p-1.5">
              <TabsTrigger value="overview" className="gap-2 font-medium text-slate-600 transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md">
                <Star className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-2 font-medium text-slate-600 transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md">
                <Users className="w-4 h-4" />
                Client Details
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2 font-medium text-slate-600 transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md">
                <Zap className="w-4 h-4" />
                Insights
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-8">
              <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-4 text-lg font-semibold text-slate-800">
                  <Star className="h-5 w-5 text-slate-700" />
                  Overview Analysis
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="bg-white border border-slate-200/70 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Summary Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-2xl font-bold text-slate-900">
                          {formatNumber(summary.totalMembers)}
                        </div>
                        <div className="text-sm text-slate-600">Total Members</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-2xl font-bold text-slate-900">
                          {formatNumber(summary.convertedMembers)}
                        </div>
                        <div className="text-sm text-slate-600">Converted</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-2xl font-bold text-slate-900">
                          {summary.conversionRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-slate-600">Conversion Rate</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-2xl font-bold text-slate-900">
                          {summary.avgConversionTime > 0 ? `${summary.avgConversionTime.toFixed(0)} days` : 'N/A'}
                        </div>
                        <div className="text-sm text-slate-600">Avg Conv. Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-slate-200/70">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Top Segments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Top by Location */}
                    <div className="mb-3">
                      <div className="mb-1 text-xs font-semibold text-slate-700">Locations</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(
                          clients.reduce((acc, c) => {
                            const loc = c.firstVisitLocation || 'Unknown';
                            acc[loc] = (acc[loc] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([loc,count]) => (
                          <span key={loc} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-800">{loc} • {formatNumber(count)}</span>
                        ))}
                      </div>
                    </div>
                    {/* Top by Trainer */}
                    <div className="mb-3">
                      <div className="mb-1 text-xs font-semibold text-slate-700">Trainers</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(
                          clients.reduce((acc, c) => {
                            const t = c.trainerName || 'Unknown';
                            acc[t] = (acc[t] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([t,count]) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-800">{t} • {formatNumber(count)}</span>
                        ))}
                      </div>
                    </div>
                    {/* Top by Membership */}
                    <div>
                      <div className="mb-1 text-xs font-semibold text-slate-700">Memberships</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(
                          clients.reduce((acc, c) => {
                            const m = c.membershipUsed || 'Unknown';
                            acc[m] = (acc[m] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([m,count]) => (
                          <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-800">{m} • {formatNumber(count)}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Discrepancy explanation when Total > New */}
              {summary.totalMembers > summary.newMembers && (
                <Card className="bg-white border border-slate-200/70">
                  <CardHeader>
                    <CardTitle className="text-slate-900">New Members Discrepancy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-3">
                      There are {formatNumber(summary.totalMembers - summary.newMembers)} member(s) in this selection who are not marked as "New". Below is a breakdown by their recorded type.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        clients.reduce((acc, c) => {
                          const isNewVal = (String(c.isNew || '').trim() || 'Unspecified');
                          if (!String(c.isNew || '').toLowerCase().includes('new')) {
                            acc[isNewVal] = (acc[isNewVal] || 0) + 1;
                          }
                          return acc;
                        }, {} as Record<string, number>)
                      ).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([label,count]) => (
                        <span key={label} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-800">{label}: {formatNumber(count)}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              </div>
            </TabsContent>

            <TabsContent value="clients" className="mt-8">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-4 text-lg font-semibold text-slate-800">
                  <Users className="h-5 w-5 text-slate-700" />
                  Client Details
                </h3>
                {renderClientTable()}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="mt-8">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Zap className="h-5 w-5 text-slate-700" />
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
                      <h4 className="mb-2 flex items-center gap-2 font-semibold text-slate-700">
                        <BarChart3 className="h-4 w-4 text-slate-700" />
                        Key Metrics
                      </h4>
                      <ul className="text-sm text-slate-700 space-y-1">
                        <li>• Total Revenue: {formatCurrency(summary.totalLTV)}</li>
                        <li>• Conversion Rate: {summary.conversionRate.toFixed(1)}%</li>
                        <li>• Retention Rate: {summary.retentionRate.toFixed(1)}%</li>
                        <li>• Average Customer Value: {formatCurrency(summary.avgLTV)}</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
                      <h4 className="mb-2 flex items-center gap-2 font-semibold text-slate-700">
                        <TrendingUp className="h-4 w-4 text-slate-700" />
                        Performance Analysis
                      </h4>
                      <ul className="text-sm text-slate-700 space-y-1">
                        <li>• {summary.conversionRate > 30 ? 'Strong' : summary.conversionRate > 15 ? 'Moderate' : 'Needs improvement'} conversion performance</li>
                        <li>• {summary.retentionRate > 70 ? 'Excellent' : summary.retentionRate > 50 ? 'Good' : 'Needs attention'} retention rate</li>
                        <li>• Customer lifetime value is {summary.avgLTV > 10000 ? 'high' : summary.avgLTV > 5000 ? 'moderate' : 'developing'}</li>
                        <li>• This selection shows targeted analytics for clicked data only</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>;
};
