
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  Calendar,
  Percent,
  FileBarChart
} from 'lucide-react';

interface DashboardNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    icon: FileBarChart,
    description: 'Comprehensive overview of all metrics'
  },
  {
    id: 'sales-analytics',
    name: 'Sales Analytics',
    icon: BarChart3,
    description: 'Revenue, transactions, and performance metrics'
  },
  {
    id: 'funnel-leads',
    name: 'Funnel & Lead Performance',
    icon: TrendingUp,
    description: 'Lead conversion and funnel analysis'
  },
  {
    id: 'client-retention',
    name: 'New Client Conversion & Retention',
    icon: Users,
    description: 'Client acquisition and retention metrics'
  },
  {
    id: 'trainer-performance',
    name: 'Trainer Performance & Analytics',
    icon: Award,
    description: 'Individual trainer performance insights'
  },
  {
    id: 'class-attendance',
    name: 'Class Attendance',
    icon: Calendar,
    description: 'Class utilization and attendance patterns'
  },
  {
    id: 'discounts-promotions',
    name: 'Discounts & Promotions',
    icon: Percent,
    description: 'Promotional campaign effectiveness'
  }
];

export const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  activeSection,
  onSectionChange
}) => {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  return (
    <Card className="bg-gradient-to-br from-slate-50 via-white to-slate-100 border-0 shadow-xl mb-8">
      <div className="p-6">
        <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          Dashboard Sections
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const isHovered = hoveredSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
                className={cn(
                  "group relative p-4 rounded-xl transition-all duration-300 text-left",
                  "hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                  isActive 
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg" 
                    : "bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 text-slate-700 shadow-md"
                )}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActive 
                      ? "bg-white/20" 
                      : "bg-slate-100 group-hover:bg-blue-100"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-white" : "text-slate-600 group-hover:text-blue-600"
                    )} />
                  </div>
                  
                  <div>
                    <p className={cn(
                      "font-medium text-sm transition-colors",
                      isActive ? "text-white" : "text-slate-900"
                    )}>
                      {section.name}
                    </p>
                    
                    {(isActive || isHovered) && (
                      <p className={cn(
                        "text-xs mt-1 transition-opacity duration-300",
                        isActive ? "text-white/80" : "text-slate-500"
                      )}>
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
