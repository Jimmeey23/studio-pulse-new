
import React from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { Home, LucideIcon, Download, Database, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '@/utils/formatters';
import { HeroExportModal } from './HeroExportModal';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
  badgeIcon: LucideIcon;
  gradient: string;
  stats?: Array<{
    value: string;
    label: string;
  }>;
  backgroundElements?: React.ReactNode;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  description,
  badgeText,
  badgeIcon: BadgeIcon,
  gradient,
  stats = [],
  backgroundElements
}) => {
  const navigate = useNavigate();

  return (
    <div className={`relative overflow-hidden ${gradient}`}>
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {backgroundElements || (
          <>
            <div className="absolute -top-4 -left-4 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-10 w-24 h-24 bg-white/20 rounded-full animate-bounce delay-1000"></div>
            <div className="absolute bottom-10 left-20 w-40 h-40 bg-white/10 rounded-full animate-pulse delay-500"></div>
          </>
        )}
      </div>
      
      <div className="relative px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </div>
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 border border-white/20 animate-fade-in-up">
              <BadgeIcon className="w-5 h-5" />
              <span className="font-medium text-white">{badgeText}</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent animate-fade-in-up delay-200">
              {title}
            </h1>
            
            <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-300">
              {description}
            </p>
            
            {stats.length > 0 && (
              <div className="flex items-center justify-center gap-8 mt-8 animate-fade-in-up delay-500">
                {stats.map((stat, index) => (
                  <React.Fragment key={index}>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-white/70">{stat.label}</div>
                    </div>
                    {index < stats.length - 1 && <div className="w-px h-12 bg-white/30" />}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Advanced Export Modal */}
            <div className="flex items-center justify-center gap-4 mt-8 animate-fade-in-up delay-700">
              <HeroExportModal 
                trigger={
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Smart Export Hub
                    <Badge variant="secondary" className="ml-2 bg-blue-500/20 text-blue-100 border-blue-400/30">
                      AI
                    </Badge>
                  </Button>
                }
              />
              
              <Button 
                size="lg"
                variant="outline"
                className="bg-white/5 hover:bg-white/10 text-white border-white/30 backdrop-blur-sm transition-all duration-300"
                onClick={() => {
                  // Quick export functionality
                  const tables = document.querySelectorAll('table[data-table]');
                  if (tables.length > 0) {
                    // Auto-detect and show count
                  }
                }}
              >
                <Database className="w-5 h-5 mr-2" />
                Quick Export ({document.querySelectorAll('table[data-table]').length})
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
        
        .delay-700 {
          animation-delay: 0.7s;
        }
      `}</style>
    </div>
  );
};
