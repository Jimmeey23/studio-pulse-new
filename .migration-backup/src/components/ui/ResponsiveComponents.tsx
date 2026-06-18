import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Monitor, 
  Tablet, 
  Smartphone,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Responsive breakpoint hook
export const useResponsiveBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });

      if (width < 768) {
        setBreakpoint('mobile');
        setIsMobile(true);
      } else if (width < 1024) {
        setBreakpoint('tablet');
        setIsMobile(false);
      } else {
        setBreakpoint('desktop');
        setIsMobile(false);
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return { breakpoint, isMobile, screenSize };
};

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className
}) => {
  const gridClasses = cn(
    'grid',
    `gap-${gap}`,
    `grid-cols-${cols.mobile}`,
    `md:grid-cols-${cols.tablet}`,
    `lg:grid-cols-${cols.desktop}`,
    className
  );

  return <div className={gridClasses}>{children}</div>;
};

// Responsive card component
interface ResponsiveCardProps {
  title: string;
  children: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  mobileCollapsible?: boolean;
  className?: string;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  children,
  expandable = false,
  defaultExpanded = true,
  mobileCollapsible = false,
  className
}) => {
  const { isMobile } = useResponsiveBreakpoint();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const shouldCollapse = mobileCollapsible && isMobile;

  return (
    <Card className={cn(
      'transition-all duration-200',
      isFullscreen && 'fixed inset-4 z-50 overflow-auto',
      className
    )}>
      <CardHeader 
        className={cn(
          'flex flex-row items-center justify-between space-y-0 pb-2',
          shouldCollapse && 'cursor-pointer'
        )}
        onClick={shouldCollapse ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="flex items-center gap-1">
          {shouldCollapse && (
            <Button variant="ghost" size="sm">
              {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          )}
          {expandable && !isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      
      {(isExpanded || !shouldCollapse) && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

// Mobile sidebar navigation
interface MobileSidebarProps {
  children: React.ReactNode;
  trigger?: React.ReactNode;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  children,
  trigger
}) => {
  const { isMobile } = useResponsiveBreakpoint();

  if (!isMobile) {
    return <div className="hidden lg:block w-64 shrink-0">{children}</div>;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Menu className="w-4 h-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        {children}
      </SheetContent>
    </Sheet>
  );
};

// Responsive table wrapper
interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
  mobileCardView?: boolean;
  cardRenderer?: (item: any) => React.ReactNode;
  data?: any[];
}

export const ResponsiveTableWrapper: React.FC<ResponsiveTableWrapperProps> = ({
  children,
  mobileCardView = true,
  cardRenderer,
  data
}) => {
  const { isMobile } = useResponsiveBreakpoint();

  if (isMobile && mobileCardView && cardRenderer && data) {
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <Card key={index} className="p-4">
            {cardRenderer(item)}
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      'overflow-x-auto',
      isMobile && 'text-sm'
    )}>
      {children}
    </div>
  );
};

// Responsive metrics grid
interface ResponsiveMetricsGridProps {
  metrics: Array<{
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
  }>;
}

export const ResponsiveMetricsGrid: React.FC<ResponsiveMetricsGridProps> = ({
  metrics
}) => {
  const { breakpoint } = useResponsiveBreakpoint();

  const getGridCols = () => {
    switch (breakpoint) {
      case 'mobile': return 'grid-cols-1';
      case 'tablet': return 'grid-cols-2';
      default: return 'grid-cols-4';
    }
  };

  return (
    <div className={cn('grid gap-4', getGridCols())}>
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
                {metric.change && (
                  <Badge
                    variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {metric.change}
                  </Badge>
                )}
              </div>
              {metric.icon && (
                <div className="text-gray-400">
                  {metric.icon}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Responsive chart container
interface ResponsiveChartContainerProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  height?: number;
  mobileHeight?: number;
}

export const ResponsiveChartContainer: React.FC<ResponsiveChartContainerProps> = ({
  children,
  title,
  description,
  height = 400,
  mobileHeight = 300
}) => {
  const { isMobile } = useResponsiveBreakpoint();
  const containerHeight = isMobile ? mobileHeight : height;

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(
          'text-lg',
          isMobile && 'text-base'
        )}>
          {title}
        </CardTitle>
        {description && (
          <p className={cn(
            'text-sm text-gray-600',
            isMobile && 'text-xs'
          )}>
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height: containerHeight }} className="w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

// Device indicator component
export const DeviceIndicator: React.FC = () => {
  const { breakpoint, screenSize } = useResponsiveBreakpoint();

  const getIcon = () => {
    switch (breakpoint) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getColor = () => {
    switch (breakpoint) {
      case 'mobile': return 'bg-red-100 text-red-800';
      case 'tablet': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <Badge className={cn('fixed bottom-2 left-2 z-50 text-xs', getColor())}>
      <div className="flex items-center gap-1">
        {getIcon()}
        <span>{breakpoint}</span>
        <span className="text-xs opacity-75">
          {screenSize.width}×{screenSize.height}
        </span>
      </div>
    </Badge>
  );
};

// Responsive layout component
interface ResponsiveLayoutProps {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  showDeviceIndicator?: boolean;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  sidebar,
  children,
  showDeviceIndicator = false
}) => {
  const { isMobile } = useResponsiveBreakpoint();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {sidebar && !isMobile && (
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-white">
          {sidebar}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar */}
      {sidebar && isMobile && (
        <MobileSidebar>
          {sidebar}
        </MobileSidebar>
      )}

      {/* Device Indicator */}
      {showDeviceIndicator && <DeviceIndicator />}
    </div>
  );
};