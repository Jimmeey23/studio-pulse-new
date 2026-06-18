import React from 'react';
import { useNavigate } from 'react-router-dom';
import SalesMotionHero from '@/components/ui/SalesMotionHero';

export type DashboardMotionHeroProps = {
  title: string;
  subtitle: string;
  metrics: Array<{ label: string; value: string; change?: string }>;
  icons?: Array<{ Icon: React.ElementType; color: string }>;
  extra?: React.ReactNode;
  onDashboardClick?: () => void;
  onExportClick?: () => void;
  compact?: boolean;
};

export const DashboardMotionHero: React.FC<DashboardMotionHeroProps> = ({
  title,
  subtitle,
  metrics,
  icons,
  extra,
  onDashboardClick,
  onExportClick,
  compact = true,
}) => {
  const [heroColor, setHeroColor] = React.useState('#3b82f6');
  const navigate = useNavigate();
  const defaultGoHome = React.useCallback(() => navigate('/'), [navigate]);

  // Make hero accent available at :root so components outside the hero (e.g., location tabs) can adopt it
  React.useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.getPropertyValue('--hero-accent');
    root.style.setProperty('--hero-accent', heroColor);
    return () => {
      if (prev) {
        root.style.setProperty('--hero-accent', prev);
      } else {
        root.style.removeProperty('--hero-accent');
      }
    };
  }, [heroColor]);

  return (
    <div style={{ ['--hero-accent' as any]: heroColor }}>
      <SalesMotionHero
        title={title}
        subtitle={subtitle}
        metrics={metrics}
        primaryAction={{ label: 'View Dashboard', onClick: onDashboardClick ?? defaultGoHome }}
        secondaryAction={extra || !onExportClick ? undefined : { label: 'Export Report', onClick: onExportClick }}
        compact={compact}
        onColorChange={setHeroColor}
        icons={icons}
        extra={extra}
      />
    </div>
  );
};

export default DashboardMotionHero;
