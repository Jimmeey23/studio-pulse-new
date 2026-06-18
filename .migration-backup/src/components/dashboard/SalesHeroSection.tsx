import React from 'react';
import SalesMotionHero from '@/components/ui/SalesMotionHero';
import { ComprehensiveSalesExportButton } from './ComprehensiveSalesExportButton';
import { useNavigate } from 'react-router-dom';
import { useSalesMetrics } from '@/hooks/useSalesMetrics';
import { SalesData } from '@/types/dashboard';

interface SalesHeroSectionProps {
  data: SalesData[];
  historicalData?: SalesData[];
  dateRange?: { start: string | Date; end: string | Date };
  currentLocation: string;
  locationName: string;
  onExportDateRangeChange?: (range: { start: string; end: string }) => void;
}

export const SalesHeroSection: React.FC<SalesHeroSectionProps> = ({
  data,
  historicalData,
  dateRange,
  currentLocation,
  locationName,
  onExportDateRangeChange,
}) => {
  const { metrics } = useSalesMetrics(data, historicalData, { dateRange });
  const [heroColor, setHeroColor] = React.useState<string>('#3b82f6');
  const lastUpdateRef = React.useRef<number>(0);
  const lastSetColorRef = React.useRef<string>('#3b82f6');
  const navigate = useNavigate();
  const exportOpenRef = React.useRef<{ open: () => void }>(null);

  // Throttled color update to prevent excessive updates from animation
  const throttledColorUpdate = React.useCallback((newColor: string) => {
    const now = Date.now();
    // Throttle to maximum 5 updates per second (200ms) and check if color actually changed
    if (now - lastUpdateRef.current > 200 && newColor !== lastSetColorRef.current) {
      lastUpdateRef.current = now;
      lastSetColorRef.current = newColor;
      setHeroColor(newColor);
    }
  }, []);

  // Make hero accent available globally for other components (like tabs) but throttle DOM updates
  React.useEffect(() => {
    const root = document.documentElement;
    const currentValue = root.style.getPropertyValue('--hero-accent');
    
    // Only update if the color has actually changed significantly
    if (heroColor !== currentValue) {
      root.style.setProperty('--hero-accent', heroColor);
    }
    
    return () => {
      // Clean up on unmount
      root.style.removeProperty('--hero-accent');
    };
  }, [heroColor]);

  // Select only 3 key metrics for hero section
  const metricOrder = [
    'Transactions',
    'Sales Revenue', 
    'Unique Members'
  ];
  
  const heroMetrics = metricOrder
    .map(title => metrics.find(metric => metric.title === title))
    .filter(Boolean)
    .map(metric => ({
      location: metric!.title,
      label: metric!.description,
      value: metric!.value,
      icon: metric!.icon,
      change: metric!.change,
      trend: metric!.changeDetails.trend,
      previousValue: metric!.previousValue
    }));

  return (
    <div style={{ ['--hero-accent' as any]: heroColor }}>
      <SalesMotionHero
        title="Sales & Revenue Analytics"
        subtitle="Track all transactional and payment metrics in one place with real-time, location-aware analytics"
      metrics={heroMetrics.map(m => ({
        label: m.location,
        value: m.value,
        change: m.change != null 
          ? `${m.change > 0 ? '+' : ''}${m.change.toFixed(1)}%`
          : undefined
      }))}
      primaryAction={{ label: 'View Dashboard', onClick: () => navigate('/') }}
      secondaryAction={{ label: 'Export All Sales Data', onClick: () => exportOpenRef.current?.open() }}
        compact
        onColorChange={throttledColorUpdate}
        extra={<ComprehensiveSalesExportButton 
          data={data} 
          currentLocation={currentLocation} 
          locationName={locationName}
          currentDateRange={{
            start: String(dateRange?.start ?? ''),
            end: String(dateRange?.end ?? ''),
          }}
          onDateRangeChange={onExportDateRangeChange}
          renderTrigger={false}
          openRef={exportOpenRef}
        />}
      />
    </div>
  );
};