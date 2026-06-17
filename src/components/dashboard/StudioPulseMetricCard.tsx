import * as React from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { CircleAlert, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StudioPulseMetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  metric: number;
  metricUnit?: string;
  subtext: string;
  description?: string;
  iconContainerClassName?: string;
  precision?: number;
  growthLabel?: string;
  growthValue?: number | null;
  secondaryGrowthLabel?: string;
  secondaryGrowthValue?: number | null;
  /** Raw metric values per month — newest last (front face, typically date-filtered) */
  sparklineData?: number[];
  /** Month labels aligned to sparklineData */
  sparklineLabels?: string[];
  /** All-time sparkline for flip back face (unaffected by date filter) */
  backSparklineData?: number[];
  /** Labels aligned to backSparklineData */
  backSparklineLabels?: string[];
  formatter?: (value: number) => string;
  badgeLabel?: string;
  tooltipContent?: string;
  onClick?: () => void;
}

const formatMetric = (value: number, precision: number, formatter?: (value: number) => string) => {
  if (formatter) return formatter(Number.isFinite(value) ? value : 0);
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(Number.isFinite(value) ? value : 0);
};

const deriveDeltaFromPercent = (current: number, percent?: number | null) => {
  if (percent === undefined || percent === null || !Number.isFinite(percent)) return null;
  if (percent === 100) return current;
  const previous = current / (1 + percent / 100);
  if (!Number.isFinite(previous)) return null;
  return current - previous;
};

const makeBarVariants = (heightPct: number) => ({
  hidden: { height: '0%' },
  visible: {
    height: `${heightPct}%`,
    transition: { type: 'spring', damping: 15, stiffness: 100 },
  },
});

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const StudioPulseMetricCard = React.forwardRef<HTMLDivElement, StudioPulseMetricCardProps>(
  (
    {
      className,
      icon,
      title,
      metric,
      metricUnit,
      subtext,
      description,
      iconContainerClassName,
      precision = 0,
      growthLabel,
      growthValue,
      secondaryGrowthLabel,
      secondaryGrowthValue,
      sparklineData,
      sparklineLabels,
      backSparklineData,
      backSparklineLabels,
      formatter,
      badgeLabel: _badgeLabel,
      tooltipContent,
      onClick: _onClick,
      ...props
    },
    ref
  ) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef, { once: true, amount: 0.4 });
    const controls = useAnimation();
    const [flipped, setFlipped] = React.useState(false);

    React.useEffect(() => {
      if (isInView) controls.start('visible');
    }, [isInView, controls]);

    // Front face sparkline — last 8 bars
    const bars = React.useMemo(() => {
      if (!sparklineData || sparklineData.length < 2) return [];
      const data = sparklineData.slice(-8);
      const max = Math.max(...data, 1);
      const labels = sparklineLabels
        ? sparklineLabels.slice(-8)
        : (() => {
            const now = new Date();
            return data.map((_, i) => SHORT_MONTHS[(now.getMonth() - (data.length - 1 - i) + 12) % 12]);
          })();
      return data.map((v, i) => ({
        value: Math.max((v / max) * 100, 3),
        rawValue: v,
        label: labels[i] ?? '',
        isLast: i === data.length - 1,
      }));
    }, [sparklineData, sparklineLabels]);

    // Back face bars — use backSparklineData (all-time) when provided, else fall back to sparklineData
    const backBars = React.useMemo(() => {
      const src = backSparklineData && backSparklineData.length > 0 ? backSparklineData : sparklineData;
      const srcLabels = backSparklineData && backSparklineData.length > 0 ? backSparklineLabels : sparklineLabels;
      if (!src || src.length === 0) return [];
      const data = src.slice(-12);
      const max = Math.max(...data, 1);
      const labels = srcLabels
        ? srcLabels.slice(-12)
        : (() => {
            const now = new Date();
            return data.map((_, i) => SHORT_MONTHS[(now.getMonth() - (data.length - 1 - i) + 12) % 12]);
          })();
      return data.map((v, i) => ({
        value: Math.max((v / max) * 100, 3),
        rawValue: v,
        label: labels[i] ?? '',
        isLast: i === data.length - 1,
      }));
    }, [sparklineData, sparklineLabels, backSparklineData, backSparklineLabels]);

    const renderGrowthBadge = (label?: string, value?: number | null) => {
      if (value === undefined) return null;
      const delta = deriveDeltaFromPercent(metric, value);
      const isPos = value !== null && value >= 0;
      const isNull = value === null;

      const prevValue = delta !== null ? metric - delta : null;
      const tooltipText = prevValue !== null
        ? `${label}: ${formatMetric(prevValue, precision, formatter)}`
        : null;

      const badge = (
        <div className="inline-flex h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-2 shadow-[0_2px_4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-150 hover:shadow-[0_4px_8px_rgba(15,23,42,0.10)] active:translate-y-px">
          <span className="text-[9px] uppercase tracking-[0.12em] text-slate-400 font-semibold">{label}</span>
          <div className="flex items-center justify-center gap-0.5">
            {!isNull && (isPos
              ? <TrendingUp className="h-3 w-3 text-emerald-500 flex-shrink-0" strokeWidth={1.75} />
              : <TrendingDown className="h-3 w-3 text-red-400 flex-shrink-0" strokeWidth={1.75} />
            )}
            <span className={cn(
              'text-[12px] font-bold tabular-nums leading-none',
              isNull ? 'text-slate-500' : isPos ? 'text-emerald-600' : 'text-red-500'
            )}>
              {isNull ? 'N/C' : `${isPos ? '+' : ''}${value!.toFixed(1)}%`}
            </span>
          </div>
        </div>
      );

      if (!tooltipText) return badge;

      return (
        <TooltipProvider key={label} delayDuration={80}>
          <Tooltip>
            <TooltipTrigger asChild className="flex-1">
              {badge}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-lg z-50">
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    };

    const accentColor = React.useMemo(() => {
      if (iconContainerClassName) {
        if (/emerald|green/.test(iconContainerClassName)) return '#10b981';
        if (/cyan|sky/.test(iconContainerClassName)) return '#06b6d4';
        if (/amber|orange|yellow/.test(iconContainerClassName)) return '#f59e0b';
        if (/red|rose/.test(iconContainerClassName)) return '#ef4444';
        if (/purple|violet/.test(iconContainerClassName)) return '#8b5cf6';
        if (/pink/.test(iconContainerClassName)) return '#ec4899';
        if (/blue/.test(iconContainerClassName)) return '#3b82f6';
      }
      if (growthValue !== null && growthValue !== undefined) {
        return growthValue >= 0 ? '#10b981' : '#ef4444';
      }
      return '#3b82f6';
    }, [iconContainerClassName, growthValue]);

    const peakIdx = React.useMemo(() => {
      if (!bars.length) return -1;
      let max = -Infinity, idx = 0;
      bars.forEach((b, i) => { if (b.rawValue > max) { max = b.rawValue; idx = i; } });
      return idx;
    }, [bars]);

    const backPeakIdx = React.useMemo(() => {
      if (!backBars.length) return -1;
      let max = -Infinity, idx = 0;
      backBars.forEach((b, i) => { if (b.rawValue > max) { max = b.rawValue; idx = i; } });
      return idx;
    }, [backBars]);

    const peakColor = '#60a5fa';
    const formattedMetric = formatMetric(metric, precision, formatter);

    return (
      <div
        ref={ref}
        className={cn('group w-full cursor-pointer', className)}
        style={{ perspective: '1200px' }}
        onClick={() => setFlipped((f) => !f)}
        {...(props as any)}
      >
        <motion.div
          style={{ transformStyle: 'preserve-3d', position: 'relative' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          whileHover={!flipped ? { scale: 1.025, y: -4 } : undefined}
        >
          {/* ── FRONT FACE ── */}
          <Card
            className={cn(
              'w-full border border-slate-100 flex flex-col',
              'shadow-[0_8px_24px_rgba(15,23,42,0.10),0_2px_8px_rgba(15,23,42,0.06)]'
            )}
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } as React.CSSProperties}
          >
            <CardHeader className="flex flex-row items-center justify-between px-4 pt-3 pb-2.5 border-b border-slate-100 shadow-[inset_0_-1px_0_rgba(15,23,42,0.06)]">
              {/* Icon + label left */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white shadow-sm',
                    iconContainerClassName || 'bg-gradient-to-br from-blue-600 to-blue-800'
                  )}
                >
                  {React.isValidElement(icon)
                    ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-3.5 w-3.5' })
                    : icon}
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <h3 className="text-[15px] font-bold tracking-tight text-slate-700 leading-tight line-clamp-2">{title}</h3>
                  {tooltipContent ? (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <CircleAlert className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px] rounded-xl border border-slate-100 bg-white p-2.5 text-[11px] leading-relaxed text-slate-600 shadow-xl z-50">
                          {tooltipContent}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                </div>
              </div>
              {/* Metric value right — fade-in reveal */}
              <motion.div
                className="flex items-center gap-1 flex-shrink-0 pl-2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
              >
                <span className="text-[1.5rem] font-extrabold tracking-tight text-slate-900 tabular-nums leading-none">
                  {formattedMetric}
                </span>
                {metricUnit ? <span className="text-[11px] font-semibold text-slate-400">{metricUnit}</span> : null}
              </motion.div>
            </CardHeader>

            <CardContent className="px-4 pt-2 pb-3 flex-1 flex flex-col">
              <div ref={cardRef} className="flex flex-col gap-3 flex-1">
                {/* Subtext */}
                <div>
                  <p className="text-[10px] text-slate-400 leading-tight">{subtext}</p>
                  {description ? (
                    <p className="mt-0.5 text-[10px] text-slate-500 leading-snug">{description}</p>
                  ) : null}
                </div>

                {/* Bar chart — front face (last 8 months) */}
                {bars.length >= 2 ? (
                  <motion.div
                    className="flex h-[72px] w-full items-end gap-[3px]"
                    initial="hidden"
                    animate={controls}
                    transition={{ staggerChildren: 0.07 }}
                    aria-label={`${title} monthly chart`}
                  >
                    {bars.map((bar, i) => {
                      const isCurrent = bar.isLast;
                      const isPeak = i === peakIdx && !isCurrent;
                      const barBg = isCurrent ? accentColor : isPeak ? peakColor : '#cbd5e1';
                      const barOpacity = isCurrent ? 1 : isPeak ? 0.85 : 0.55;

                      return (
                        <TooltipProvider key={i} delayDuration={60}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="flex h-full flex-1 flex-col items-center justify-end gap-[3px] group/bar"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <motion.div
                                  className="w-full rounded-t-[6px] transition-opacity duration-150 group-hover/bar:opacity-100"
                                  style={{ backgroundColor: barBg, opacity: barOpacity }}
                                  variants={makeBarVariants(bar.value)}
                                />
                                <span className={cn(
                                  'text-[8px] font-semibold leading-none',
                                  isCurrent ? 'text-slate-600' : 'text-slate-400'
                                )}>
                                  {bar.label}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-700 shadow-md">
                              {bar.label}: {formatMetric(bar.rawValue, precision, formatter)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </motion.div>
                ) : null}

                {/* Growth badges — pinned to bottom */}
                <div className="mt-auto flex gap-2 [&>*]:flex-1">
                  {renderGrowthBadge(growthLabel, growthValue)}
                  {renderGrowthBadge(secondaryGrowthLabel, secondaryGrowthValue)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── BACK FACE ── */}
          <Card
            className={cn(
              'absolute inset-0 w-full border border-slate-100 flex flex-col overflow-hidden bg-white',
              'shadow-[0_8px_24px_rgba(15,23,42,0.10),0_2px_8px_rgba(15,23,42,0.06)]'
            )}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            } as React.CSSProperties}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
              className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex flex-col gap-3 px-4 pt-4 pb-4 h-full">
              {/* Title + metric large */}
              <div className="flex flex-col gap-0.5 pr-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{title}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[2rem] font-extrabold tracking-tight text-slate-900 tabular-nums leading-none">
                    {formattedMetric}
                  </span>
                  {metricUnit ? <span className="text-[13px] font-semibold text-slate-400">{metricUnit}</span> : null}
                </div>
              </div>

              {/* 12-month bar chart */}
              {backBars.length > 0 ? (
                <div className="flex-1 flex flex-col gap-1 min-h-0">
                  <span className="text-[9px] uppercase tracking-[0.1em] text-slate-400 font-semibold">12-Month Trend</span>
                  <div
                    className="flex h-full w-full items-end gap-[2px]"
                    aria-label={`${title} 12-month chart`}
                  >
                    {backBars.map((bar, i) => {
                      const isCurrent = bar.isLast;
                      const isPeak = i === backPeakIdx && !isCurrent;
                      const barBg = isCurrent ? accentColor : isPeak ? peakColor : '#cbd5e1';
                      const barOpacity = isCurrent ? 1 : isPeak ? 0.85 : 0.5;

                      return (
                        <TooltipProvider key={i} delayDuration={60}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="flex h-full flex-1 flex-col items-center justify-end gap-[2px] group/bar"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  className="w-full rounded-t-[4px] transition-opacity duration-150 group-hover/bar:opacity-100"
                                  style={{
                                    height: `${bar.value}%`,
                                    backgroundColor: barBg,
                                    opacity: barOpacity,
                                  }}
                                />
                                <span className={cn(
                                  'text-[7px] font-semibold leading-none',
                                  isCurrent ? 'text-slate-600' : 'text-slate-400'
                                )}>
                                  {bar.label}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-700 shadow-md">
                              {bar.label}: {formatMetric(bar.rawValue, precision, formatter)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-[11px] text-slate-400">No historical data available</span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }
);

StudioPulseMetricCard.displayName = 'StudioPulseMetricCard';

export { StudioPulseMetricCard };
