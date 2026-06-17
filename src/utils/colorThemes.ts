// Centralized color theme system for consistent styling across all dashboard tabs

export interface ColorTheme {
  name: string;
  heroGradient: string;
  activeTabGradient: string;
  accentColors: {
    primary: string;
    secondary: string;
    light: string;
    dark: string;
  };
  metricCardBorder: string;
  tableHeaderGradient: string;
  badgeColors: string;
}

export const colorThemes: Record<string, ColorTheme> = {
  sales: {
    name: 'Sales Analytics',
    heroGradient: 'from-slate-900 via-blue-900 to-slate-800',
    activeTabGradient: 'from-blue-600 to-blue-800',
    accentColors: {
      primary: 'blue-600',
      secondary: 'blue-500',
      light: 'blue-100',
      dark: 'blue-800'
    },
    metricCardBorder: 'border-blue-200',
    tableHeaderGradient: 'from-slate-800 via-slate-900 to-slate-800',
    badgeColors: 'bg-blue-100 text-blue-800'
  },
  
  discounts: {
    name: 'Discounts & Promotions',
    heroGradient: 'from-stone-900 via-amber-900 to-stone-800',
    activeTabGradient: 'from-orange-600 to-amber-600',
    accentColors: {
      primary: 'orange-600',
      secondary: 'amber-500',
      light: 'orange-100',
      dark: 'orange-800'
    },
    metricCardBorder: 'border-orange-200',
    tableHeaderGradient: 'from-orange-700 to-amber-800',
    badgeColors: 'bg-orange-100 text-orange-800'
  },
  
  funnel: {
    name: 'Lead Funnel',
    heroGradient: 'from-slate-900 via-violet-900 to-slate-800',
    activeTabGradient: 'from-red-600 to-rose-700',
    accentColors: {
      primary: 'red-600',
      secondary: 'rose-500',
      light: 'red-100',
      dark: 'red-800'
    },
    metricCardBorder: 'border-red-200',
    tableHeaderGradient: 'from-red-700 to-rose-800',
    badgeColors: 'bg-red-100 text-red-800'
  },
  
  retention: {
    name: 'Client Retention',
    heroGradient: 'from-gray-900 via-purple-900 to-gray-800',
    activeTabGradient: 'from-purple-600 to-violet-700',
    accentColors: {
      primary: 'purple-600',
      secondary: 'violet-500',
      light: 'purple-100',
      dark: 'purple-800'
    },
    metricCardBorder: 'border-purple-200',
    tableHeaderGradient: 'from-slate-800 via-slate-900 to-slate-800',
    badgeColors: 'bg-purple-100 text-purple-800'
  },
  
  attendance: {
    name: 'Class Attendance',
    heroGradient: 'from-gray-900 via-purple-900 to-gray-800',
    activeTabGradient: 'from-purple-600 to-violet-700',
    accentColors: {
      primary: 'purple-600',
      secondary: 'violet-500',
      light: 'purple-100',
      dark: 'purple-800'
    },
    metricCardBorder: 'border-purple-200',
    tableHeaderGradient: 'from-slate-800 via-slate-900 to-slate-800',
    badgeColors: 'bg-purple-100 text-purple-800'
  },
  
  powercycle: {
    name: 'PowerCycle vs Barre',
    heroGradient: 'from-zinc-900 via-cyan-900 to-zinc-800',
    activeTabGradient: 'from-cyan-800 to-teal-900',
    accentColors: {
      primary: 'cyan-600',
      secondary: 'teal-500',
      light: 'cyan-100',
      dark: 'cyan-800'
    },
    metricCardBorder: 'border-cyan-200',
    tableHeaderGradient: 'from-cyan-700 to-teal-800',
    badgeColors: 'bg-cyan-100 text-cyan-800'
  },
  
  expiration: {
    name: 'Expiration Analytics',
    heroGradient: 'from-neutral-900 via-red-900 to-neutral-800',
    activeTabGradient: 'from-red-600 to-pink-700',
    accentColors: {
      primary: 'red-600',
      secondary: 'pink-500',
      light: 'red-100',
      dark: 'red-800'
    },
    metricCardBorder: 'border-red-200',
    tableHeaderGradient: 'from-red-700 to-pink-800',
    badgeColors: 'bg-red-100 text-red-800'
  },
  
  cancellations: {
    name: 'Late Cancellations',
    heroGradient: 'from-stone-900 via-rose-900 to-stone-800',
    activeTabGradient: 'from-rose-600 to-pink-700',
    accentColors: {
      primary: 'rose-600',
      secondary: 'pink-500',
      light: 'rose-100',
      dark: 'rose-800'
    },
    metricCardBorder: 'border-rose-200',
    tableHeaderGradient: 'from-rose-700 to-pink-800',
    badgeColors: 'bg-rose-100 text-rose-800'
  },
  
  analytics: {
    name: 'Analytics & Performance',
    heroGradient: 'from-zinc-900 via-indigo-900 to-zinc-800',
    activeTabGradient: 'from-indigo-600 to-indigo-800',
    accentColors: {
      primary: 'indigo-600',
      secondary: 'indigo-500',
      light: 'indigo-100',
      dark: 'indigo-800'
    },
    metricCardBorder: 'border-indigo-200',
    tableHeaderGradient: 'from-slate-800 via-slate-900 to-slate-800',
    badgeColors: 'bg-indigo-100 text-indigo-800'
  },
  
  summary: {
    name: 'Executive Summary',
    heroGradient: 'from-slate-900 via-teal-900 to-slate-800',
    activeTabGradient: 'from-blue-600 to-purple-600',
    accentColors: {
      primary: 'blue-600',
      secondary: 'purple-500',
      light: 'blue-100',
      dark: 'blue-800'
    },
    metricCardBorder: 'border-blue-200',
    tableHeaderGradient: 'from-slate-800 via-slate-900 to-slate-800',
    badgeColors: 'bg-blue-100 text-blue-800'
  }
};

// Helper function to get theme colors
export const getThemeColors = (variant: string): ColorTheme => {
  return colorThemes[variant] || colorThemes.summary;
};

// Helper function to get CSS classes for active tabs
export const getActiveTabClasses = (variant: string): string => {
  const theme = getThemeColors(variant);
  return `text-slate-700 data-[state=active]:bg-gradient-to-r data-[state=active]:${theme.activeTabGradient} data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-black/10 hover:text-slate-900`;
};

// Helper function to get table header classes
export const getTableHeaderClasses = (variant: string): string => {
  const theme = getThemeColors(variant);
  return `bg-gradient-to-r ${theme.tableHeaderGradient} text-white`;
};

// Helper function to get metric card border classes
export const getMetricCardClasses = (variant: string): string => {
  const theme = getThemeColors(variant);
  return theme.metricCardBorder;
};