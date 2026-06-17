import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Clock, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertCircle,
  Pause,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  lastRefresh?: Date;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  autoRefreshInterval?: number; // in seconds
  onAutoRefreshToggle?: (enabled: boolean) => void;
  status?: 'success' | 'error' | 'idle';
  className?: string;
}

export const RefreshIndicator: React.FC<RefreshIndicatorProps> = ({
  isRefreshing,
  lastRefresh,
  onRefresh,
  autoRefresh = false,
  autoRefreshInterval = 30,
  onAutoRefreshToggle,
  status = 'idle',
  className
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Update time ago display
  useEffect(() => {
    if (!lastRefresh) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
      
      if (diff < 60) {
        setTimeAgo(`${diff}s ago`);
      } else if (diff < 3600) {
        setTimeAgo(`${Math.floor(diff / 60)}m ago`);
      } else {
        setTimeAgo(`${Math.floor(diff / 3600)}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection restored",
        description: "Data refresh is now available",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection lost",
        description: "Data refresh is temporarily unavailable",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const handleRefresh = useCallback(() => {
    if (!isOnline || isRefreshing) return;
    onRefresh?.();
  }, [isOnline, isRefreshing, onRefresh]);

  const getStatusIcon = () => {
    if (isRefreshing) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (isRefreshing) return 'bg-blue-500';
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Indicator */}
      <div className="relative">
        <motion.div
          className={`w-2 h-2 rounded-full ${getStatusColor()}`}
          animate={isRefreshing ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 1 } : undefined}
        />
      </div>

      {/* Last Refresh Time */}
      {lastRefresh && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          {getStatusIcon()}
          <span>{timeAgo}</span>
        </div>
      )}

      {/* Network Status */}
      <div className="flex items-center gap-1">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
      </div>

      {/* Auto Refresh Toggle */}
      {onAutoRefreshToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAutoRefreshToggle(!autoRefresh)}
          className="h-7 px-2"
        >
          {autoRefresh ? (
            <>
              <Pause className="w-3 h-3 mr-1" />
              <span className="text-xs">Auto</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 mr-1" />
              <span className="text-xs">Auto</span>
            </>
          )}
        </Button>
      )}

      {/* Manual Refresh */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={!isOnline || isRefreshing}
        className="h-7 px-2"
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};

// Auto-refresh hook
export const useAutoRefresh = (
  refreshFn: () => void,
  interval: number = 30000, // 30 seconds
  enabled: boolean = true
) => {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshFn();
        setLastRefresh(new Date());
      }
    }, interval);

    return () => clearInterval(timer);
  }, [refreshFn, interval, isEnabled]);

  const toggle = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  const refresh = useCallback(() => {
    refreshFn();
    setLastRefresh(new Date());
  }, [refreshFn]);

  return {
    isEnabled,
    toggle,
    refresh,
    lastRefresh
  };
};

// Data freshness indicator
export const DataFreshnessIndicator: React.FC<{
  data: any[];
  lastUpdate?: Date;
  maxAge?: number; // in minutes
  showDetails?: boolean;
}> = ({ data, lastUpdate, maxAge = 30, showDetails = false }) => {
  const [freshness, setFreshness] = useState<'fresh' | 'stale' | 'expired'>('fresh');

  useEffect(() => {
    if (!lastUpdate) return;

    const checkFreshness = () => {
      const now = new Date();
      const ageInMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
      
      if (ageInMinutes <= maxAge / 2) {
        setFreshness('fresh');
      } else if (ageInMinutes <= maxAge) {
        setFreshness('stale');
      } else {
        setFreshness('expired');
      }
    };

    checkFreshness();
    const interval = setInterval(checkFreshness, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [lastUpdate, maxAge]);

  const getFreshnessColor = () => {
    switch (freshness) {
      case 'fresh': return 'bg-green-100 text-green-800 border-green-200';
      case 'stale': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getFreshnessText = () => {
    switch (freshness) {
      case 'fresh': return 'Fresh';
      case 'stale': return 'Stale';
      case 'expired': return 'Expired';
    }
  };

  if (!showDetails && freshness === 'fresh') return null;

  return (
    <Badge variant="outline" className={`${getFreshnessColor()} text-xs`}>
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${
          freshness === 'fresh' ? 'bg-green-500' : 
          freshness === 'stale' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        {getFreshnessText()}
        {showDetails && (
          <span className="ml-1">
            ({data.length.toLocaleString()} records)
          </span>
        )}
      </div>
    </Badge>
  );
};

// Global refresh status component
export const GlobalRefreshStatus: React.FC<{
  refreshStates: Record<string, {
    isLoading: boolean;
    lastRefresh?: Date;
    error?: string;
  }>;
  onRefreshAll?: () => void;
}> = ({ refreshStates, onRefreshAll }) => {
  const isAnyRefreshing = Object.values(refreshStates).some(state => state.isLoading);
  const hasErrors = Object.values(refreshStates).some(state => state.error);
  const totalSources = Object.keys(refreshStates).length;
  const refreshingSources = Object.values(refreshStates).filter(state => state.isLoading).length;

  return (
    <Card className="fixed bottom-4 right-4 z-50 shadow-lg">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {isAnyRefreshing && (
            <motion.div
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
          
          <div className="text-sm">
            {isAnyRefreshing ? (
              <span>Refreshing {refreshingSources}/{totalSources} data sources...</span>
            ) : hasErrors ? (
              <span className="text-red-600">Some data sources failed to refresh</span>
            ) : (
              <span className="text-green-600">All data sources up to date</span>
            )}
          </div>

          {onRefreshAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshAll}
              disabled={isAnyRefreshing}
              className="h-6 px-2"
            >
              <RefreshCw className={`w-3 h-3 ${isAnyRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};