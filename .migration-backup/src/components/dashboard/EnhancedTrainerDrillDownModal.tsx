import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTrainerImage } from '@/components/ui/TrainerAvatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  Users, 
  DollarSign, 
  Target, 
  Calendar,
  Award,
  Activity,
  Star,
  X,
  MapPin,
  Search
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { format } from 'date-fns';

interface EnhancedTrainerDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerName: string;
  trainerData: any;
  monthYear: string;
}

export function EnhancedTrainerDrillDownModal({ 
  isOpen, 
  onClose, 
  trainerName, 
  trainerData, 
  monthYear
}: EnhancedTrainerDrillDownModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Process individual session data
  const processedData = useMemo(() => {

    
    if (!trainerData || !trainerData.individualSessions) {
      return {
        sessions: [],
        metrics: {
          totalSessions: 0,
          totalRevenue: 0,
          totalAttendees: 0,
          totalCapacity: 0,
          avgRevenue: 0,
          avgAttendees: 0,
          fillRate: 0
        },
        byLocation: []
      };
    }

    const sessions = trainerData.individualSessions;
    
    // Calculate overall metrics
    const totalSessions = sessions.length;
    const totalRevenue = sessions.reduce((sum: number, s: any) => sum + (parseFloat(s.revenue) || 0), 0);
    const totalAttendees = sessions.reduce((sum: number, s: any) => sum + (parseInt(s.attendees) || 0), 0);
    const totalCapacity = sessions.reduce((sum: number, s: any) => sum + (parseInt(s.capacity) || 0), 0);
    const avgRevenue = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    const avgAttendees = totalSessions > 0 ? totalAttendees / totalSessions : 0;
    const fillRate = totalCapacity > 0 ? (totalAttendees / totalCapacity) * 100 : 0;

    // Group by location
    const byLocation = sessions.reduce((acc: any, session: any) => {
      const location = session.location || 'Unknown';
      if (!acc[location]) {
        acc[location] = { 
          name: location, 
          sessions: 0, 
          revenue: 0, 
          attendees: 0 
        };
      }
      acc[location].sessions += 1;
      acc[location].revenue += parseFloat(session.revenue) || 0;
      acc[location].attendees += parseInt(session.attendees) || 0;
      return acc;
    }, {});

    const locationStats = Object.values(byLocation).sort((a: any, b: any) => b.revenue - a.revenue);

    return {
      sessions,
      metrics: {
        totalSessions,
        totalRevenue,
        totalAttendees,
        totalCapacity,
        avgRevenue,
        avgAttendees,
        fillRate
      },
      byLocation: locationStats
    };
  }, [trainerData]);

  // Filter sessions based on search and filters
  const filteredSessions = useMemo(() => {
    let filtered = processedData.sessions;

    if (searchTerm) {
      filtered = filtered.filter((session: any) => 
        (session.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.date || '').includes(searchTerm)
      );
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter((session: any) => session.location === selectedLocation);
    }

    return filtered;
  }, [processedData.sessions, searchTerm, selectedLocation]);

  // Get unique values for filters
  const uniqueLocations = Array.from(new Set(processedData.sessions.map((s: any) => s.location).filter(Boolean)));

  // Performance score calculation
  const performanceScore = useMemo(() => {
    const revenueScore = Math.min((processedData.metrics.avgRevenue / 100) * 20, 30);
    const fillRateScore = Math.min(processedData.metrics.fillRate * 0.4, 40);
    const sessionScore = Math.min((processedData.metrics.totalSessions / 10) * 10, 30);
    return Math.min(revenueScore + fillRateScore + sessionScore, 100);
  }, [processedData.metrics]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 bg-white border-0 shadow-2xl overflow-hidden">
        <div className="flex h-full overflow-hidden">
          {/* Left Profile Panel - Theme colors: silver, white, deep blue */}
          <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 flex flex-col overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight">{trainerName}</h2>
              <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Trainer Image - Full height */}
            <div className="text-center mb-6 flex-1 flex flex-col">
              <div className="relative flex-1 max-h-80 mx-auto mb-4 rounded-xl overflow-hidden border border-white/20 shadow-lg bg-gradient-to-br from-slate-600 to-slate-700">
                <img 
                  src={getTrainerImage(trainerName)}
                  alt={trainerName}
                  className="w-full h-full object-cover"
                  style={{ minHeight: '200px' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const initials = trainerName.split(' ').map((n: string) => n[0]).join('');
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-6xl font-bold">${initials}</div>`;
                  }}
                />
              </div>
              
              <div className="mt-4">
                <Badge className="bg-white/10 text-white border-white/20">
                  <Star className="w-3 h-3 mr-1" />
                  Trainer Profile
                </Badge>
              </div>
            </div>

            {/* Performance Details */}
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <div className="text-xs font-semibold uppercase tracking-wide mb-3 opacity-80">Performance Overview</div>
              <ul className="space-y-2 text-sm">
                <li><span className="opacity-70">Period:</span> <span className="font-medium">{monthYear}</span></li>
                <li><span className="opacity-70">Total Sessions:</span> <span className="font-medium">{processedData.metrics.totalSessions}</span></li>
                <li><span className="opacity-70">Total Revenue:</span> <span className="font-medium">{formatCurrency(processedData.metrics.totalRevenue)}</span></li>
                <li><span className="opacity-70">Avg Attendees:</span> <span className="font-medium">{processedData.metrics.avgAttendees.toFixed(1)}</span></li>
                <li><span className="opacity-70">Fill Rate:</span> <span className="font-medium">{processedData.metrics.fillRate.toFixed(1)}%</span></li>
              </ul>
            </div>

            {/* Performance Score */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">Performance Score</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xl font-bold">{performanceScore.toFixed(0)}/100</div>
                <Progress value={performanceScore} className="flex-1 h-2 bg-white/20" />
              </div>
              <p className="text-xs opacity-70 mt-2">
                {performanceScore >= 80 ? 'Outstanding' : performanceScore >= 60 ? 'Great' : performanceScore >= 40 ? 'Good' : 'Needs Improvement'}
              </p>
            </div>
          </div>

          {/* Right Analytics Panel */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{trainerName} - {monthYear}</h2>
                <div className="text-sm text-slate-600">Individual session analytics</div>
              </div>
            </div>

            {/* Quick Stats Grid - No background colors */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sessions</div>
                <div className="text-2xl font-bold text-slate-900">{processedData.metrics.totalSessions}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Attendees</div>
                <div className="text-2xl font-bold text-slate-900">{processedData.metrics.totalAttendees}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fill Rate</div>
                <div className="text-2xl font-bold text-slate-900">{processedData.metrics.fillRate.toFixed(1)}%</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Revenue</div>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(processedData.metrics.totalRevenue)}</div>
              </div>
            </div>

            {/* Location Performance Chart */}
            {processedData.byLocation.length > 0 && (
              <Card className="border border-slate-200 mb-8">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Performance by Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={processedData.byLocation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        fontSize={12} 
                        tick={{ fill: '#64748b' }}
                      />
                      <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#f8fafc', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value, name) => [
                          name === 'revenue' ? formatCurrency(value) : value,
                          name === 'revenue' ? 'Revenue' : 'Sessions'
                        ]}
                      />
                      <Bar dataKey="revenue" fill="#1e293b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Individual Sessions */}
            <Card className="border border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Individual Sessions</CardTitle>
                  <div className="text-sm text-slate-600">{filteredSessions.length} sessions</div>
                </div>
                
                {/* Search and Filters */}
                <div className="flex gap-3 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search sessions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {uniqueLocations.map((location) => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredSessions.map((session: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow" style={{ minHeight: '35px' }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="px-2 py-1 rounded bg-slate-800 text-white text-xs font-semibold">
                            {session.className || session.cleanedClass || 'Class'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">
                              {session.date ? format(new Date(session.date), 'dd-MMM-yyyy') : 'No Date'}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.location || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-600">
                          <span>Revenue: <span className="font-medium text-slate-800">{formatCurrency(parseFloat(session.revenue) || 0)}</span></span>
                          <span>Attendees: <span className="font-medium text-slate-800">{session.attendees || 0}</span></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-700">
                          {session.attendees || 0}/{session.capacity || 0}
                        </div>
                        <div className="text-xs text-slate-500">
                          {session.capacity ? Math.round(((session.attendees || 0) / session.capacity) * 100) : 0}% full
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredSessions.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No sessions found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}