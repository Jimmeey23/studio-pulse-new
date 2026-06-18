import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { TrendingUp, TrendingDown, Users, Calendar, MapPin, DollarSign, Activity, Target, Clock, Star, Zap, X, Download, Copy, LayoutGrid, List, Award, UserCheck, Repeat, CreditCard, Building2, Mail, Phone } from 'lucide-react';
import { NewClientData } from '@/types/dashboard';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientConversionDrillDownModalV3Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  type: 'month' | 'year' | 'class' | 'membership' | 'metric' | 'ranking';
}

export const ClientConversionDrillDownModalV3: React.FC<ClientConversionDrillDownModalV3Props> = ({
  isOpen,
  onClose,
  title,
  data,
  type
}) => {
  if (!data) return null;

  const [quickFilter, setQuickFilter] = React.useState<'all' | 'new' | 'converted' | 'retained' | 'highLTV'>('all');
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');
  const [search, setSearch] = React.useState('');

  // Extract targeted client data
  const clients: NewClientData[] = React.useMemo(() => {
    if (!data) return [];
    if (type === 'ranking' && data.relatedClients) return data.relatedClients;
    if (type === 'metric' && data.clients) return data.clients;
    if ((type === 'month' || type === 'year') && data.clients) return data.clients;
    if (data.clients && Array.isArray(data.clients)) return data.clients;
    if (Array.isArray(data)) return data;
    return [];
  }, [data, type]);

  // Calculate summary metrics
  const summary = React.useMemo(() => {
    const totalMembers = clients.length;
    const newMembers = clients.filter(c => String(c.isNew || '').toLowerCase().includes('new')).length;
    const convertedMembers = clients.filter(c => (c.conversionStatus || '').trim() === 'Converted').length;
    const retainedMembers = clients.filter(c => (c.retentionStatus || '').trim() === 'Retained').length;
    const totalLTV = clients.reduce((sum, c) => sum + (c.ltv || 0), 0);
    const totalConversionSpan = clients.filter(c => c.conversionSpan > 0).reduce((sum, c) => sum + (c.conversionSpan || 0), 0);
    const clientsWithConversionData = clients.filter(c => c.conversionSpan > 0).length;
    
    return {
      totalMembers,
      newMembers,
      convertedMembers,
      retainedMembers,
      conversionRate: newMembers > 0 ? (convertedMembers / newMembers) * 100 : 0,
      retentionRate: newMembers > 0 ? (retainedMembers / newMembers) * 100 : 0,
      avgLTV: totalMembers > 0 ? totalLTV / totalMembers : 0,
      totalLTV,
      avgConversionTime: clientsWithConversionData > 0 ? totalConversionSpan / clientsWithConversionData : 0
    };
  }, [clients]);

  // Apply filters
  const displayedClients = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    let arr = clients;
    if (quickFilter === 'new') arr = arr.filter(c => String(c.isNew || '').toLowerCase().includes('new'));
    else if (quickFilter === 'converted') arr = arr.filter(c => (c.conversionStatus || '').trim() === 'Converted');
    else if (quickFilter === 'retained') arr = arr.filter(c => (c.retentionStatus || '').trim() === 'Retained');
    else if (quickFilter === 'highLTV') {
      const values = arr.map(c => c.ltv || 0).sort((a,b) => a - b);
      const p75 = values.length ? values[Math.floor(0.75 * (values.length - 1))] : 0;
      arr = arr.filter(c => (c.ltv || 0) >= p75);
    }
    if (term) arr = arr.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(term) || (c.email || '').toLowerCase().includes(term));
    return arr;
  }, [clients, quickFilter, search]);

  const exportCSV = React.useCallback((rows: NewClientData[]) => {
    if (!rows || rows.length === 0) return;
    const headers = ['First Name','Last Name','Email','Is New','Conversion Status','Retention Status','LTV','First Visit Date','First Visit Location','Trainer','Membership'];
    const lines = rows.map(r => [
      r.firstName || '', r.lastName || '', r.email || '', r.isNew || '', r.conversionStatus || '', r.retentionStatus || '',
      String(r.ltv ?? ''), r.firstVisitDate || '', r.firstVisitLocation || '', r.trainerName || '', r.membershipUsed || ''
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
    if (emails) navigator.clipboard.writeText(emails);
  }, []);

  // Top segments analysis
  const topSegments = React.useMemo(() => {
    const locationCounts = clients.reduce((acc, c) => {
      const loc = c.firstVisitLocation || 'Unknown';
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const trainerCounts = clients.reduce((acc, c) => {
      const t = c.trainerName || 'Unknown';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const membershipCounts = clients.reduce((acc, c) => {
      const m = c.membershipUsed || 'Unknown';
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      locations: Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
      trainers: Object.entries(trainerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
      memberships: Object.entries(membershipCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    };
  }, [clients]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 border-0 shadow-2xl">
        {/* Premium Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
              <p className="text-slate-300 text-sm">Detailed client analysis and insights</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Users className="w-4 h-4 text-white/70" />
                <span className="text-white font-semibold">{formatNumber(displayedClients.length)}</span>
                <span className="text-white/50 text-sm">of {formatNumber(clients.length)}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-6 space-y-6">
          {/* Summary Metrics - Premium Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Users, label: 'Total Members', value: formatNumber(summary.totalMembers), color: 'from-blue-500 to-blue-600' },
              { icon: Target, label: 'New Members', value: formatNumber(summary.newMembers), color: 'from-emerald-500 to-emerald-600' },
              { icon: Star, label: 'Converted', value: formatNumber(summary.convertedMembers), color: 'from-amber-500 to-orange-500' },
              { icon: TrendingUp, label: 'Conv. Rate', value: `${summary.conversionRate.toFixed(1)}%`, color: 'from-purple-500 to-purple-600' },
              { icon: Repeat, label: 'Retained', value: formatNumber(summary.retainedMembers), color: 'from-pink-500 to-rose-500' },
              { icon: DollarSign, label: 'Avg LTV', value: formatCurrency(summary.avgLTV), color: 'from-cyan-500 to-teal-500' },
            ].map((metric, idx) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-xl blur-xl" style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }}></div>
                <div className="relative bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <metric.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">{metric.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-100/80 rounded-xl border border-slate-200">
            {/* Quick Filters */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
              {(['all', 'new', 'converted', 'retained', 'highLTV'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setQuickFilter(q)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    quickFilter === q 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {q === 'all' ? 'All' : q === 'new' ? 'New' : q === 'converted' ? 'Converted' : q === 'retained' ? 'Retained' : 'High LTV'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full h-9 pl-4 pr-10 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
              <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('cards')} className={`p-2 rounded-md transition-all ${viewMode === 'cards' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => exportCSV(displayedClients)} className="gap-2">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => copyEmails(displayedClients)} className="gap-2">
                <Copy className="w-4 h-4" /> Copy Emails
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="clients" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 rounded-xl p-1 h-12">
              <TabsTrigger value="clients" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Users className="w-4 h-4" />
                Client Details
              </TabsTrigger>
              <TabsTrigger value="segments" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Building2 className="w-4 h-4" />
                Segments
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Zap className="w-4 h-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="mt-4">
              {viewMode === 'table' ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                          <TableHead className="text-white font-semibold text-xs">Name</TableHead>
                          <TableHead className="text-white font-semibold text-xs">Email</TableHead>
                          <TableHead className="text-white font-semibold text-xs">Membership</TableHead>
                          <TableHead className="text-white font-semibold text-xs">Trainer</TableHead>
                          <TableHead className="text-white font-semibold text-xs">First Visit</TableHead>
                          <TableHead className="text-white font-semibold text-xs">Location</TableHead>
                          <TableHead className="text-white font-semibold text-xs">Status</TableHead>
                          <TableHead className="text-white font-semibold text-xs text-right">LTV</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedClients.slice(0, 100).map((client, idx) => (
                          <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-medium text-slate-900">
                              {client.firstName} {client.lastName}
                            </TableCell>
                            <TableCell className="text-slate-600 text-sm max-w-[200px] truncate" title={client.email}>
                              {client.email}
                            </TableCell>
                            <TableCell className="text-slate-700 text-sm max-w-[180px] truncate">
                              {client.membershipUsed || '—'}
                            </TableCell>
                            <TableCell className="text-slate-700 text-sm">
                              {client.trainerName || '—'}
                            </TableCell>
                            <TableCell className="text-slate-600 text-sm">
                              {client.firstVisitDate || '—'}
                            </TableCell>
                            <TableCell className="text-slate-700 text-sm max-w-[150px] truncate">
                              {client.firstVisitLocation || '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {client.conversionStatus === 'Converted' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    Converted
                                  </span>
                                )}
                                {client.retentionStatus === 'Retained' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Retained
                                  </span>
                                )}
                                {client.conversionStatus !== 'Converted' && client.retentionStatus !== 'Retained' && (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-slate-900">
                              {formatCurrency(client.ltv || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {displayedClients.length > 100 && (
                    <div className="p-4 text-center text-sm text-slate-500 border-t border-slate-100">
                      Showing 100 of {formatNumber(displayedClients.length)} clients
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedClients.slice(0, 50).map((client, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 truncate">{client.firstName} {client.lastName}</h4>
                          <p className="text-xs text-slate-500 truncate">{client.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900">{formatCurrency(client.ltv || 0)}</div>
                          <div className="text-xs text-slate-400">LTV</div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{client.membershipUsed || 'No membership'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.trainerName || 'No trainer'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{client.firstVisitLocation || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.firstVisitDate || '—'}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100">
                        {client.conversionStatus === 'Converted' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Converted</span>
                        )}
                        {client.retentionStatus === 'Retained' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Retained</span>
                        )}
                        {String(client.isNew || '').toLowerCase().includes('new') && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">New</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="segments" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Locations */}
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      Top Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topSegments.locations.map(([loc, count], idx) => (
                      <div key={loc} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-700' : 
                            idx === 1 ? 'bg-slate-200 text-slate-600' : 
                            idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-700 truncate max-w-[140px]">{loc}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{formatNumber(count)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Trainers */}
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                      Top Trainers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topSegments.trainers.map(([trainer, count], idx) => (
                      <div key={trainer} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-700' : 
                            idx === 1 ? 'bg-slate-200 text-slate-600' : 
                            idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-700 truncate max-w-[140px]">{trainer}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{formatNumber(count)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Memberships */}
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-500" />
                      Top Memberships
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topSegments.memberships.map(([membership, count], idx) => (
                      <div key={membership} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-700' : 
                            idx === 1 ? 'bg-slate-200 text-slate-600' : 
                            idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-700 truncate max-w-[140px]">{membership}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{formatNumber(count)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-emerald-700">Total Revenue</span>
                      <span className="font-bold text-emerald-900">{formatCurrency(summary.totalLTV)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-emerald-700">Conversion Rate</span>
                      <span className="font-bold text-emerald-900">{summary.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-emerald-700">Retention Rate</span>
                      <span className="font-bold text-emerald-900">{summary.retentionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-emerald-700">Avg Conversion Time</span>
                      <span className="font-bold text-emerald-900">{summary.avgConversionTime > 0 ? `${Math.round(summary.avgConversionTime)} days` : 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-orange-100/50 border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-amber-800 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Key Observations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2 text-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                        <span>{summary.conversionRate > 30 ? 'Strong conversion performance' : summary.conversionRate > 15 ? 'Moderate conversion, room for improvement' : 'Conversion needs attention'}</span>
                      </li>
                      <li className="flex items-start gap-2 text-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                        <span>{summary.retentionRate > 70 ? 'Excellent retention rate' : summary.retentionRate > 50 ? 'Good retention, can be optimized' : 'Retention needs focus'}</span>
                      </li>
                      <li className="flex items-start gap-2 text-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                        <span>Average LTV is {formatCurrency(summary.avgLTV)} per member</span>
                      </li>
                      <li className="flex items-start gap-2 text-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                        <span>{summary.totalMembers} total members in this analysis</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
