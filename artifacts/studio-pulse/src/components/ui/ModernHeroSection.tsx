import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Home, Download, TrendingUp, Users, UserCheck, Calendar, Percent, Filter, CheckCircle, Zap, Calendar as CalendarIcon, X, BarChart3, DollarSign, Target, Clock, Trophy, Star, Award, Activity, Sparkles, Play, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';
interface MetricData {
  label: string;
  value: string;
  location: string;
  change?: number;
  trend?: 'strong' | 'moderate' | 'weak';
  icon?: React.ComponentType<any>;
}
export interface ModernHeroSectionProps {
  title: string;
  subtitle: string;
  variant: 'sales' | 'client' | 'trainer' | 'sessions' | 'discounts' | 'funnel' | 'attendance' | 'powercycle' | 'expiration' | 'cancellations' | 'summary';
  onExport?: () => void;
  showHomeButton?: boolean;
  metrics?: MetricData[];
  exportButton?: React.ReactNode;
  location?: string; // Add location prop for audio selection
  compact?: boolean; // Compact mode for shorter hero section
}
const gradientVariants = {
  sales: 'from-slate-900 via-blue-900 to-slate-800',
  client: 'from-gray-900 via-blue-900 to-gray-800',
  trainer: 'from-zinc-900 via-indigo-900 to-zinc-800',
  sessions: 'from-neutral-900 via-orange-900 to-neutral-800',
  discounts: 'from-stone-900 via-amber-900 to-stone-800',
  funnel: 'from-slate-900 via-violet-900 to-slate-800',
  attendance: 'from-gray-900 via-emerald-900 to-gray-800',
  powercycle: 'from-zinc-900 via-cyan-900 to-zinc-800',
  expiration: 'from-neutral-900 via-red-900 to-neutral-800',
  cancellations: 'from-stone-900 via-rose-900 to-stone-800',
  summary: 'from-slate-900 via-teal-900 to-slate-800'
};
const iconVariants = {
  sales: [TrendingUp, DollarSign, BarChart3, Target],
  client: [Users, UserCheck, Award, Star],
  trainer: [UserCheck, Trophy, Activity, Award],
  sessions: [Calendar, Clock, CalendarIcon, CheckCircle],
  discounts: [Percent, Star, Target, Sparkles],
  funnel: [Filter, Target, TrendingUp, BarChart3],
  attendance: [CheckCircle, Users, Activity, Calendar],
  powercycle: [Zap, Activity, TrendingUp, Target],
  expiration: [Clock, CalendarIcon, Target, Star],
  cancellations: [X, Calendar, Clock, Target],
  summary: [BarChart3, TrendingUp, Award, Star]
};
const FloatingIcon: React.FC<{
  Icon: React.ComponentType<any>;
  className: string;
  delay?: number;
}> = ({
  Icon,
  className,
  delay = 0
}) => <div className={`absolute ${className} animate-float opacity-20 hover:opacity-40 transition-opacity duration-300`} style={{
  animationDelay: `${delay}s`
}}>
    <Icon className="w-full h-full text-white drop-shadow-lg" />
  </div>;
const AnimatedFloatingElements: React.FC<{
  variant: string;
}> = ({
  variant
}) => {
  const icons = iconVariants[variant as keyof typeof iconVariants] || iconVariants.summary;
  return <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary floating icons */}
      <FloatingIcon Icon={icons[0]} className="top-10 left-10 w-16 h-16" delay={0} />
      <FloatingIcon Icon={icons[1]} className="top-32 right-20 w-12 h-12" delay={0.5} />
      <FloatingIcon Icon={icons[2]} className="bottom-20 left-32 w-20 h-20" delay={1} />
      <FloatingIcon Icon={icons[3]} className="bottom-32 right-1/3 w-14 h-14" delay={1.5} />
      
      {/* Secondary floating icons */}
      <FloatingIcon Icon={icons[0]} className="top-1/2 left-1/4 w-10 h-10" delay={0.8} />
      <FloatingIcon Icon={icons[1]} className="top-20 right-1/2 w-8 h-8" delay={1.2} />
      <FloatingIcon Icon={icons[2]} className="top-3/4 right-1/4 w-6 h-6" delay={0.3} />
      <FloatingIcon Icon={icons[3]} className="bottom-1/2 left-1/6 w-8 h-8" delay={1.8} />
      
      {/* Tertiary floating elements */}
      <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-white/30 rounded-full animate-pulse" style={{
      animationDelay: '0.5s'
    }}></div>
      <div className="absolute top-1/3 right-1/5 w-2 h-2 bg-white/40 rounded-full animate-ping" style={{
      animationDelay: '1s'
    }}></div>
      <div className="absolute bottom-1/4 left-1/2 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{
      animationDelay: '1.5s'
    }}></div>
      <div className="absolute top-2/3 right-2/3 w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{
      animationDelay: '2s'
    }}></div>
      <div className="absolute bottom-1/6 right-1/6 w-3 h-3 bg-white/30 rounded-full animate-ping" style={{
      animationDelay: '0.2s'
    }}></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full bg-grid-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
      </div>
    </div>;
};
export const ModernHeroSection: React.FC<ModernHeroSectionProps> = ({
  title,
  subtitle,
  variant,
  onExport,
  showHomeButton = true,
  metrics = [],
  exportButton,
  location,
  compact = true
}) => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayAudio = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setAudioError(null);
      
      // Select audio source based on variant and location
      const audioSrc = (variant === 'sales' || (variant === 'summary' && location === 'Kwality House'))
        ? '/kwality-house-audio.mp3' 
        : '/placeholder-audio.mp3';
      
      logger.debug('Attempting to play audio:', audioSrc);
      logger.debug('Current audio element:', audioRef.current);
      
      // Set the source
      audioRef.current.src = audioSrc;
      
      // Reset the audio element
      audioRef.current.load();
      
      // Set volume to ensure it's audible
      audioRef.current.volume = 0.8;
      
      // Try to play
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        logger.debug('Audio started playing successfully');
      }
    } catch (error: any) {
      logger.error('Failed to play audio:', error);
      let errorMessage = 'Failed to play audio.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Audio playback was blocked by browser. Please enable autoplay or try again.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Audio format not supported by your browser.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Audio playback was aborted.';
      }
      
      setAudioError(errorMessage);
      setTimeout(() => setAudioError(null), 5000); // Clear error after 5 seconds
    }
  };
  return <div className={cn(
    "relative overflow-hidden bg-gradient-to-br text-white",
    gradientVariants[variant],
    compact ? "min-h-[240px]" : "min-h-[360px]"
  )}>
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        onEnded={() => {
          logger.debug('Audio ended');
          setIsPlaying(false);
        }}
        onError={(e) => {
          logger.error('Audio element error:', e);
          setAudioError('Audio file could not be loaded');
          setIsPlaying(false);
        }}
        onLoadStart={() => logger.debug('Audio load started')}
        onCanPlay={() => logger.debug('Audio can play')}
        onPlay={() => logger.debug('Audio play event')}
        onPause={() => logger.debug('Audio pause event')}
        preload="metadata"
        controls={false}
      >
        {/* Multiple source formats for better compatibility */}
        <source src="/kwality-house-audio.mp3" type="audio/mpeg" />
        <source src="/placeholder-audio.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      {/* Background overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
      
      {/* Animated floating elements */}
      {/* Subtle background accents for a leaner look */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      </div>
      
      {/* Corner buttons - More compact layout */}
      <div className="absolute top-4 left-4 z-20">
        {showHomeButton && <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')} 
            className="group text-white/90 hover:text-white bg-transparent backdrop-blur-lg border-2 border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:bg-white/10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Home className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Dashboard</span>
          </Button>}
      </div>
      
  <div className="absolute top-4 right-4 z-20 flex gap-2">
        {/* Audio Play Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handlePlayAudio} 
          className={cn(
            "group text-white/90 hover:text-white backdrop-blur-lg border-2 transition-all duration-300 hover:scale-105 relative overflow-hidden",
            "bg-transparent hover:bg-white/8 border-white/15 hover:border-white/25",
            audioError && "border-red-400/50 bg-red-500/10"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/3 to-white/6 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {isPlaying ? <Pause className="w-4 h-4 mr-2 relative z-10" /> : <Play className="w-4 h-4 mr-2 relative z-10" />}
          <span className="relative z-10">{isPlaying ? 'Pause' : 'Play'}</span>
        </Button>
        
        {exportButton || (onExport && <Button 
            variant="ghost" 
            size="sm" 
            onClick={onExport} 
            className="group text-white/90 hover:text-white bg-transparent backdrop-blur-lg border-2 border-white/15 hover:border-white/25 transition-all duration-300 hover:scale-105 hover:bg-white/8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/3 to-white/6 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Download className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Export</span>
          </Button>)}
      </div>
      
      {/* Error message */}
      {audioError && (
        <div className="absolute top-16 right-4 z-20 bg-red-500/20 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm border border-red-400/30 max-w-xs">
          {audioError}
        </div>
      )}
      
      {/* Content */}
      <div className={cn(
        "relative z-10 flex items-center justify-center px-6",
        compact ? "min-h-[240px] py-6" : "min-h-[360px] py-8"
      )}>
        <div className="text-center max-w-7xl mx-auto w-full">
          <h1 className={cn(
            "font-black mb-2 animate-fade-in bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent drop-shadow-2xl tracking-tight",
            compact ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"
          )}>
            {title}
          </h1>
          <p className={cn(
            "text-white/90 animate-slide-up delay-200 max-w-3xl mx-auto leading-relaxed font-medium",
            compact ? "text-sm md:text-base mb-4" : "text-base md:text-lg mb-6"
          )}>
            {subtitle}
          </p>
          
          {/* Metrics Display - Enhanced 3-metric layout with better animations */}
          {metrics.length > 0 && (
            <div className={cn("max-w-6xl mx-auto", compact ? "mt-4" : "mt-6")}> 
              {/* 3-metric premium layout with advanced animations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metrics.slice(0, 3).map((metric, index) => {
                  const isCenter = index === 1;
                  const change = metric.change || 0;
                  const isPositive = change > 0;
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "group relative rounded-xl p-3 border transition-all duration-300 ease-out",
                        "bg-transparent backdrop-blur-0",
                        "hover:bg-white/5",
                        "shadow-none hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
                        "hover:scale-[1.01]",
                        "animate-fade-in cursor-pointer",
                        "overflow-hidden",
                        isCenter 
                          ? "border-white/25 md:scale-[1.01]"
                          : "border-white/10 hover:border-white/25"
                      )}
                      style={{
                        animationDelay: `${index * 200}ms`,
                        animationFillMode: 'both'
                      }}
                    >
                      {/* Subtle top accent (leaner) */}
                      <div className={cn(
                        "absolute inset-x-0 top-0 h-[2px] rounded-t-xl transition-all duration-500",
                        "bg-gradient-to-r from-blue-400/20 via-cyan-400/30 to-blue-400/20",
                        "group-hover:from-blue-300/30 group-hover:via-cyan-300/40 group-hover:to-blue-300/30"
                      )} />
                      
                      {/* Content container */}
                      <div className="relative z-10 space-y-3">
                        {/* Optional Icon (transparent, lean) */}
                        {metric.icon && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white/80">
                              <metric.icon className="w-4 h-4 opacity-90" />
                              <span className="sr-only">metric icon</span>
                            </div>
                          </div>
                        )}
                        {/* Label with fade-in animation */}
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            "text-[10px] uppercase tracking-widest font-semibold transition-all duration-300",
                            "text-white/70 group-hover:text-white/90 group-hover:tracking-[0.2em]"
                          )}>
                            {metric.location}
                          </div>
                          
                          {/* Change indicator badge */}
                          {change !== 0 && (
                            <div className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold",
                              "backdrop-blur-sm transition-all duration-500",
                              "group-hover:scale-110",
                              isPositive 
                                ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20" 
                                : "bg-red-500/15 text-red-200 border border-red-400/20"
                            )}>
                              <span>{isPositive ? '↑' : '↓'}</span>
                              <span>{Math.abs(change).toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Value with scale animation */}
                        <div className={cn(
                          "font-extrabold text-white drop-shadow-xl transition-all duration-300",
                          "group-hover:scale-105",
                          isCenter ? "text-2xl" : "text-xl"
                        )}>
                          {metric.value}
                        </div>
                        
                        {/* Description with slide animation */}
                        <div className={cn(
                          "text-[11px] text-white/80 font-medium leading-relaxed",
                          "group-hover:text-white/95 transition-all duration-300"
                        )}>
                          {metric.label}
                        </div>
                        
                        {/* Decorative shimmer line (lighter) */}
                        <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent group-hover:via-white/30 transition-all duration-300" />
                      </div>
                      
                      {/* Removed large corner accent for leaner look */}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom gradient fade (shorter) */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
    </div>;
};