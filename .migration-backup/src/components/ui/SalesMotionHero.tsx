import * as React from 'react';
import { motion, useMotionValue, useSpring, animate, useMotionTemplate } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  LayoutDashboard,
  Download,
} from 'lucide-react';

type MetricCardData = {
  label: string;
  value: string;
  change?: string; // e.g., "+12.5% from last month"
};

const salesIcons = [
  { Icon: TrendingUp, color: '#10b981' },
  { Icon: DollarSign, color: '#3b82f6' },
  { Icon: ShoppingCart, color: '#8b5cf6' },
  { Icon: BarChart3, color: '#f59e0b' },
  { Icon: PieChart, color: '#ec4899' },
  { Icon: LineChart, color: '#06b6d4' },
];

interface FloatingIconProps {
  Icon: React.ElementType;
  color: string;
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
  className: string;
  index: number;
}

const FloatingIcon: React.FC<FloatingIconProps> = ({
  Icon,
  color,
  mouseX,
  mouseY,
  className,
  index,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  React.useEffect(() => {
    const handleMouseMove = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const distance = Math.hypot(
          mouseX.current - (rect.left + rect.width / 2),
          mouseY.current - (rect.top + rect.height / 2)
        );

        if (distance < 150) {
          const angle = Math.atan2(
            mouseY.current - (rect.top + rect.height / 2),
            mouseX.current - (rect.left + rect.width / 2)
          );
          const force = (1 - distance / 150) * 50;
          x.set(-Math.cos(angle) * force);
          y.set(-Math.sin(angle) * force);
        } else {
          x.set(0);
          y.set(0);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y, mouseX, mouseY]);

  // Parallax depth: larger layer => farther => slower, less movement, more blur, lower opacity
  const layer = (index % 6) / 6; // 0..~0.83
  const amp = 6 + (1 - layer) * 10; // near moves more
  const rotAmp = 3 + (1 - layer) * 3;
  const speed = 6 + layer * 6 + Math.random() * 2; // farther = slower
  const blurPx = 0.5 + layer * 2;
  const opacity = 0.15 + (1 - layer) * 0.25; // near more visible

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY, opacity }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn('absolute pointer-events-none transition-opacity', className)}
    >
      <motion.div
        className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
        style={{ 
          filter: `blur(${blurPx}px)`,
          boxShadow: `0 8px 32px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
        }}
        animate={{
          y: [0, -amp, 0, amp, 0],
          x: [0, amp * 0.8, 0, -amp * 0.8, 0],
          rotate: [0, rotAmp, 0, -rotAmp, 0],
          scale: [1, 1.04, 1, 0.98, 1]
        }}
        transition={{ duration: speed, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      >
        <Icon className="w-6 h-6 md:w-7 md:h-7" style={{ color }} />
      </motion.div>
    </motion.div>
  );
};

// Compact metric pill used in hero
const MetricPill: React.FC<MetricCardData & { delay?: number; borderStyle?: any }> = ({ label, value, change, delay = 0, borderStyle }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="rounded-xl px-4 py-3 backdrop-blur-sm text-left"
    style={{ border: borderStyle }}
  >
    <div className="text-[11px] uppercase tracking-widest font-semibold text-white/85">
      {label}
    </div>
    <div className="flex items-center gap-2">
      <div className="text-2xl font-bold text-white">{value}</div>
      {change && (
        <div className="flex items-center gap-1 text-xs text-emerald-400">
          <ArrowUpRight className="w-4 h-4" />
          <span>{change}</span>
        </div>
      )}
    </div>
  </motion.div>
);

export interface SalesMotionHeroProps {
  title: string;
  subtitle: string;
  metrics: MetricCardData[];
  primaryAction?: { label: string; onClick?: () => void };
  secondaryAction?: { label: string; onClick?: () => void };
  compact?: boolean; // default true
  onColorChange?: (color: string) => void;
  icons?: Array<{ Icon: React.ElementType; color: string }>;
  extra?: React.ReactNode;
}

export const SalesMotionHero: React.FC<SalesMotionHeroProps> = ({
  title,
  subtitle,
  metrics,
  primaryAction,
  secondaryAction,
  compact = true,
  onColorChange,
  icons,
  extra,
}) => {
  const mouseX = React.useRef(0);
  const mouseY = React.useRef(0);
  const color = useMotionValue('#3b82f6');

  React.useEffect(() => {
    animate(color, ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'], {
      ease: 'easeInOut',
      duration: 10,
      repeat: Infinity,
      repeatType: 'mirror',
    });
    const unsubscribe = color.on('change', (v) => {
      onColorChange?.(String(v));
    });
    return () => {
      unsubscribe();
    };
  }, [color]);

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #020617 50%, ${color})`;
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    mouseX.current = event.clientX;
    mouseY.current = event.clientY;
  };

  const iconPositions = [
    'top-[10%] left-[10%]',
    'top-[20%] right-[8%]',
    'top-[80%] left-[10%]',
    'bottom-[10%] right-[10%]',
    'top-[5%] left-[30%]',
    'top-[5%] right-[30%]',
    'bottom-[8%] left-[25%]',
    'top-[40%] left-[15%]',
    'top-[75%] right-[25%]',
    'top-[90%] left-[70%]',
    'top-[50%] right-[5%]',
    'top-[55%] left-[5%]',
  ];

  const iconSet = icons && icons.length > 0 ? icons : salesIcons;

  return (
    <motion.section
      style={{ 
        backgroundImage,
        backdropFilter: 'blur(20px)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 20px 40px rgba(0, 0, 0, 0.1)'
      }}
      onMouseMove={handleMouseMove}
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 text-gray-100 px-4 border-b border-white/10',
        compact ? 'py-24 min-h-[480px]' : 'py-24 min-h-[420px]'
      )}
    >
      {/* Extreme-corner CTAs */}
      {(primaryAction || secondaryAction || extra) && (
        <div className="absolute inset-x-0 top-4 z-20">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center">
              {primaryAction && (
                <motion.button
                  style={{ border, boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)' }}
                  whileHover={{ scale: 1.05, y: -2, boxShadow: '0 0 30px rgba(255, 255, 255, 0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={primaryAction?.onClick}
                  className="group relative flex items-center justify-center gap-2 rounded-xl bg-transparent backdrop-blur-lg border-2 border-white/20 px-6 py-3 text-white font-semibold transition-all duration-300 hover:bg-white/10 hover:border-white/30 shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <LayoutDashboard className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{primaryAction?.label ?? 'View Dashboard'}</span>
                </motion.button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {secondaryAction && (
                <motion.button
                  style={{ border, boxShadow: '0 0 15px rgba(255, 255, 255, 0.08)' }}
                  whileHover={{ scale: 1.05, y: -2, boxShadow: '0 0 25px rgba(255, 255, 255, 0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={secondaryAction?.onClick}
                  className="group relative flex items-center justify-center gap-2 rounded-xl bg-transparent backdrop-blur-lg border-2 border-white/15 px-6 py-3 text-gray-100 font-semibold transition-all duration-300 hover:bg-white/8 hover:border-white/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/3 to-white/6 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Download className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{secondaryAction?.label ?? 'Export Report'}</span>
                </motion.button>
              )}
              {extra && (
                <div className="flex items-center">{extra}</div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {[...iconSet, ...iconSet].map((item, index) => (
          <FloatingIcon
            key={index}
            Icon={item.Icon}
            color={item.color}
            mouseX={mouseX}
            mouseY={mouseY}
            className={iconPositions[index % iconPositions.length]}
            index={index}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          {/* Corner CTA bars handled above */}

          {/* Badge as in provided component */}
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block rounded-full bg-gray-600/30 px-4 py-1.5 text-xs mb-4"
          >
            Real-time Analytics Dashboard
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              'font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent mb-2',
              compact ? 'text-6xl md:text-7xl' : 'text-6xl md:text-8xl'
            )}
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className={cn(
              'text-gray-300 mx-auto',
              compact ? 'text-sm md:text-base max-w-2xl mb-6' : 'text-lg md:text-xl max-w-2xl mb-8'
            )}
          >
            {subtitle}
          </motion.p>

          {/* CTA grid removed in favor of left/right bar above */}

        </div>

        {metrics?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="max-w-5xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.slice(0, 3).map((m, i) => (
                <MetricPill key={i} label={m.label} value={m.value} change={m.change} delay={0.45 + i * 0.12} borderStyle={border} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};

export default SalesMotionHero;
