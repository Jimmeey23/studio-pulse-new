import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Presentation, 
  Share2, 
  RefreshCw, 
  Maximize, 
  Play, 
  Pause,
  Copy,
  Users,
  X,
  Eye,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { usePayrollData } from '@/hooks/usePayrollData';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';

interface SimplePresenterModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimplePresenterMode: React.FC<SimplePresenterModeProps> = ({ isOpen, onClose }) => {
  const { data: payrollData, isLoading: loading } = usePayrollData();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showControls, setShowControls] = useState(true);

  // Calculate totals for presentation
  const totals = useMemo(() => {
    if (!payrollData || payrollData.length === 0) {
      return {
        cycle: { sessions: 0, revenue: 0, visits: 0, fillRate: 0 },
        barre: { sessions: 0, revenue: 0, visits: 0, fillRate: 0 },
        strength: { sessions: 0, revenue: 0, visits: 0, fillRate: 0 }
      };
    }

    const sum = (key: string) => payrollData.reduce((acc, row) => acc + (Number(row[key as keyof typeof row] as any) || 0), 0);
    
    return {
      cycle: {
        sessions: sum('cycleSessions'),
        revenue: sum('cyclePaid'),
        visits: sum('cycleCustomers'),
        fillRate: sum('cycleSessions') > 0 ? ((sum('cycleSessions') - sum('emptyCycleSessions')) / sum('cycleSessions')) * 100 : 0
      },
      barre: {
        sessions: sum('barreSessions'),
        revenue: sum('barrePaid'),
        visits: sum('barreCustomers'),
        fillRate: sum('barreSessions') > 0 ? ((sum('barreSessions') - sum('emptyBarreSessions')) / sum('barreSessions')) * 100 : 0
      },
      strength: {
        sessions: sum('strengthSessions'),
        revenue: sum('strengthPaid'),
        visits: sum('strengthCustomers'),
        fillRate: sum('strengthSessions') > 0 ? ((sum('strengthSessions') - sum('emptyStrengthSessions')) / sum('strengthSessions')) * 100 : 0
      }
    };
  }, [payrollData]);

  // Generate shareable URL
  const sharePresentation = async () => {
    const url = `${window.location.origin}${window.location.pathname}?presenter=true`;
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
      alert('Share link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'h':
        case 'H':
          setShowControls(prev => !prev);
          break;
        case ' ':
          event.preventDefault();
          setAutoRefresh(prev => !prev);
          break;
        case 'c':
        case 'C':
          if (event.ctrlKey) {
            event.preventDefault();
            sharePresentation();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Controls Header */}
      <div className={`absolute top-0 left-0 right-0 z-60 transition-all duration-300 ${
        showControls ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="bg-black/80 backdrop-blur-sm text-white p-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Presentation className="h-5 w-5 text-blue-400" />
                <span className="font-semibold">Presenter Mode</span>
              </div>
              
              <Badge variant={autoRefresh ? "default" : "secondary"} className={autoRefresh ? "bg-green-600" : ""}>
                {autoRefresh ? (
                  <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Live</>
                ) : (
                  <><Pause className="h-3 w-3 mr-1" /> Paused</>
                )}
              </Badge>

              <span className="text-xs text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={sharePresentation}
                className="text-white hover:bg-white/20"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="text-white hover:bg-white/20"
              >
                {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {autoRefresh ? 'Pause' : 'Resume'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`h-full overflow-auto p-8 transition-all duration-300 ${
        showControls ? 'pt-24' : 'pt-8'
      }`}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <BrandSpinner size="lg" className="mx-auto mb-4" ringClassName="border-white/70" />
              <p className="text-2xl">Loading presentation data...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Title */}
            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                PowerCycle vs Barre vs Strength
              </h1>
              <p className="text-xl text-gray-300">
                Performance Analytics Dashboard
              </p>
            </div>

            {/* Format Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* PowerCycle */}
              <Card className="bg-gradient-to-br from-blue-600/90 to-blue-800/90 border-blue-400 shadow-2xl hover:shadow-blue-500/50 transition-all">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <div className="p-3 bg-blue-400 rounded-lg">
                      <BarChart3 className="h-8 w-8 text-blue-900" />
                    </div>
                    PowerCycle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatNumber(totals.cycle.sessions)}
                      </div>
                      <div className="text-blue-200 text-sm">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatCurrency(totals.cycle.revenue)}
                      </div>
                      <div className="text-blue-200 text-sm">Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatNumber(totals.cycle.visits)}
                      </div>
                      <div className="text-blue-200 text-sm">Visits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatPercentage(totals.cycle.fillRate)}
                      </div>
                      <div className="text-blue-200 text-sm">Fill Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Barre */}
              <Card className="bg-gradient-to-br from-pink-600/90 to-pink-800/90 border-pink-400 shadow-2xl hover:shadow-pink-500/50 transition-all">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <div className="p-3 bg-pink-400 rounded-lg">
                      <Users className="h-8 w-8 text-pink-900" />
                    </div>
                    Barre
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatNumber(totals.barre.sessions)}
                      </div>
                      <div className="text-pink-200 text-sm">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatCurrency(totals.barre.revenue)}
                      </div>
                      <div className="text-pink-200 text-sm">Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatNumber(totals.barre.visits)}
                      </div>
                      <div className="text-pink-200 text-sm">Visits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatPercentage(totals.barre.fillRate)}
                      </div>
                      <div className="text-pink-200 text-sm">Fill Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strength */}
              <Card className="bg-gradient-to-br from-orange-600/90 to-orange-800/90 border-orange-400 shadow-2xl hover:shadow-orange-500/50 transition-all">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <div className="p-3 bg-orange-400 rounded-lg">
                      <DollarSign className="h-8 w-8 text-orange-900" />
                    </div>
                    Strength
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatNumber(totals.strength.sessions)}
                      </div>
                      <div className="text-orange-200 text-sm">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatCurrency(totals.strength.revenue)}
                      </div>
                      <div className="text-orange-200 text-sm">Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatNumber(totals.strength.visits)}
                      </div>
                      <div className="text-orange-200 text-sm">Visits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatPercentage(totals.strength.fillRate)}
                      </div>
                      <div className="text-orange-200 text-sm">Fill Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Stats */}
            <Card className="bg-gradient-to-r from-gray-800/90 to-gray-900/90 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white text-3xl text-center">
                  Overall Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                  <div>
                    <div className="text-4xl font-bold text-white mb-2">
                      {formatNumber(totals.cycle.sessions + totals.barre.sessions + totals.strength.sessions)}
                    </div>
                    <div className="text-gray-300">Total Sessions</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-2">
                      {formatCurrency(totals.cycle.revenue + totals.barre.revenue + totals.strength.revenue)}
                    </div>
                    <div className="text-gray-300">Total Revenue</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-2">
                      {formatNumber(totals.cycle.visits + totals.barre.visits + totals.strength.visits)}
                    </div>
                    <div className="text-gray-300">Total Visits</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-2">
                      {formatPercentage(
                        ((totals.cycle.fillRate + totals.barre.fillRate + totals.strength.fillRate) / 3)
                      )}
                    </div>
                    <div className="text-gray-300">Avg Fill Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Control Hints */}
      <div className={`absolute bottom-4 left-4 text-white/70 text-sm transition-all duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 space-y-1">
          <div>Press <kbd className="bg-white/20 px-2 py-1 rounded text-xs">H</kbd> to hide/show controls</div>
          <div>Press <kbd className="bg-white/20 px-2 py-1 rounded text-xs">Space</kbd> to toggle auto-refresh</div>
          <div>Press <kbd className="bg-white/20 px-2 py-1 rounded text-xs">Ctrl+C</kbd> to share</div>
          <div>Press <kbd className="bg-white/20 px-2 py-1 rounded text-xs">Esc</kbd> to exit</div>
        </div>
      </div>
    </div>
  );
};