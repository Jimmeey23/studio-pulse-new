import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Users, TrendingUp, Calendar, Award, Target, Clock, UserCheck, AlertTriangle, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { LeadsData } from '@/types/leads';

interface FunnelDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: LeadsData[];
  type: string;
}

export const FunnelDrillDownModal: React.FC<FunnelDrillDownModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  type
}) => {
  const columns = [
    {
      key: 'fullName',
      header: 'Name',
      className: 'min-w-[150px]',
      render: (value: string, row: LeadsData) => (
        <div className="font-medium text-gray-900">
          <div className="text-sm font-semibold">{value}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {row.phone}
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      className: 'min-w-[200px]',
      render: (value: string) => (
        <div className="text-sm text-gray-600 truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'source',
      header: 'Source',
      align: 'center' as const,
      render: (value: string) => (
        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
          {value || 'Unknown'}
        </Badge>
      )
    },
    {
      key: 'stage',
      header: 'Stage',
      align: 'center' as const,
      render: (value: string) => (
        <Badge 
          variant="outline"
          className={`${
            value?.includes('Trial') 
              ? 'text-purple-600 border-purple-200 bg-purple-50' 
              : value?.includes('Proximity')
              ? 'text-red-600 border-red-200 bg-red-50'
              : 'text-gray-600 border-gray-200 bg-gray-50'
          }`}
        >
          {value || 'Unknown'}
        </Badge>
      )
    },
    {
      key: 'conversionStatus',
      header: 'Conversion',
      align: 'center' as const,
      render: (value: string) => (
        <Badge 
          variant={value?.toLowerCase().includes('converted') ? 'default' : 'secondary'}
          className={value?.toLowerCase().includes('converted') ? 'bg-green-100 text-green-800' : ''}
        >
          {value || 'Pending'}
        </Badge>
      )
    },
    {
      key: 'ltv',
      header: 'LTV',
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-semibold text-emerald-600">
          {formatCurrency(value || 0)}
        </span>
      )
    },
    {
      key: 'visits',
      header: 'Visits',
      align: 'center' as const,
      render: (value: number) => (
        <div className="text-sm font-medium text-gray-700">
          {formatNumber(value || 0)}
        </div>
      )
    },
    {
      key: 'center',
      header: 'Location',
      className: 'min-w-[150px]',
      render: (value: string) => (
        <div className="text-sm text-gray-600 truncate flex items-center gap-1" title={value}>
          <MapPin className="w-3 h-3 text-gray-400" />
          {value || 'Unknown'}
        </div>
      )
    }
  ];

  // Calculate summary metrics
  const summary = React.useMemo(() => {
    const totalLeads = data.length;
    const trialsCompleted = data.filter(d => d.stage === 'Trial Completed').length;
    const trialsScheduled = data.filter(d => d.stage?.includes('Trial')).length;
    const convertedLeads = data.filter(d => d.conversionStatus === 'Converted').length;
    const proximityIssues = data.filter(d => d.stage?.includes('Proximity') || d.remarks?.toLowerCase().includes('proximity')).length;
    const totalLTV = data.reduce((sum, d) => sum + (d.ltv || 0), 0);
    const totalVisits = data.reduce((sum, d) => sum + (d.visits || 0), 0);
    
    return {
      totalLeads,
      trialsCompleted,
      trialsScheduled,
      convertedLeads,
      proximityIssues,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      trialConversionRate: trialsCompleted > 0 ? (convertedLeads / trialsCompleted) * 100 : 0,
      avgLTV: totalLeads > 0 ? totalLTV / totalLeads : 0,
      avgVisits: totalLeads > 0 ? totalVisits / totalLeads : 0,
      totalLTV
    };
  }, [data]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[1400px] max-h-[90vh] overflow-hidden p-0 bg-white border-slate-200 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-slate-700 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white -m-6 mb-6 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              {title} - Detailed Analysis
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto px-8 py-6 space-y-8" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          
          {/* Summary Cards */}
          <div className="p-6 bg-white border-2 border-blue-400 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-blue-700 mb-6 flex items-center gap-2 pb-4 border-b border-blue-200">
              <Target className="w-5 h-5 text-blue-600" />
              Key Performance Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white border-2 border-blue-500 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatNumber(summary.totalLeads)}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">Total Leads</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-emerald-500 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {formatNumber(summary.convertedLeads)}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">Converted</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-purple-500 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-700">
                    {summary.conversionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-600 font-medium">Conv. Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-rose-500 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-600" />
                <div>
                  <div className="text-2xl font-bold text-rose-700">
                    {formatCurrency(summary.avgLTV)}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">Avg LTV</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-amber-500 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="text-2xl font-bold text-amber-700">
                    {summary.avgVisits.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">Avg Visits</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </div>

          {/* Lead Data Table */}
          <div className="p-6 bg-white border-2 border-emerald-400 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-emerald-700 mb-6 flex items-center gap-2 pb-4 border-b border-emerald-200">
              <Award className="w-5 h-5 text-emerald-600" />
              Lead Details ({formatNumber(data.length)} leads)
            </h3>
            <ModernDataTable
              data={data}
              columns={columns}
              headerGradient="from-slate-900 via-blue-950 to-slate-900"
              maxHeight="450px"
              stickyHeader={true}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};