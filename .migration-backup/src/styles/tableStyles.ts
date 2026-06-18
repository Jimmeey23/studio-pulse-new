/**
 * Unified Table Styles - Based on Sales Tab MonthOnMonthTableNew
 * 
 * This provides consistent styling across all tables in the application.
 * Use these styles with ModernDataTable, ModernTableWrapper, and custom tables.
 */

export const TABLE_STYLES = {
  // Container styles
  container: "relative overflow-auto rounded-xl border border-slate-200 shadow-sm",
  
  // Table base
  table: "min-w-full bg-white font-sans",
  
  // Header styles - Dark slate gradient matching Sales tab
  header: {
    wrapper: "sticky top-0 z-30",
    row: "bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800",
    cell: "px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wide border-r border-white/20 last:border-r-0 font-sans",
    cellCenter: "text-center",
    cellSticky: "sticky left-0 bg-gradient-to-r from-slate-800 to-slate-900 z-40 border-r border-white/20",
    monthCell: "min-w-[90px] text-center",
    monthDisplay: "flex flex-col items-center",
    monthText: "text-xs font-bold whitespace-nowrap font-sans",
    yearText: "text-slate-300 text-xs font-sans",
  },
  
  // Body styles
  body: {
    row: "bg-white hover:bg-slate-50 border-b border-gray-200 transition-all duration-200 font-sans",
    rowAlternate: "bg-slate-50/50",
    rowClickable: "cursor-pointer hover:scale-[1.002] hover:shadow-sm",
    cell: "px-3 py-2 text-sm text-slate-700 border-r border-gray-200/50 last:border-r-0 font-sans",
    cellCenter: "text-center",
    cellBold: "font-semibold text-slate-900",
    cellMono: "font-mono",
    cellSticky: "sticky left-0 bg-white hover:bg-slate-50 border-r border-gray-200 z-20",
    cellHover: "hover:bg-slate-50 cursor-pointer transition-all duration-200",
  },
  
  // Group/Category row styles
  group: {
    row: "bg-slate-100 hover:bg-slate-200 border-b border-slate-300 transition-all duration-200",
    cell: "px-4 py-2 text-sm font-bold text-slate-800",
    cellSticky: "sticky left-0 bg-slate-100 hover:bg-slate-200 border-r border-slate-300 z-20",
    badge: "inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-sm",
    expandIcon: "w-4 h-4 text-slate-600 transition-transform duration-200",
    expandIconRotated: "rotate-90",
  },
  
  // Total/Footer row styles
  footer: {
    row: "bg-slate-800 text-white font-bold sticky bottom-0 z-20",
    cell: "px-3 py-2 text-sm font-bold border-r border-slate-600 last:border-r-0",
    cellCenter: "text-center",
    cellSticky: "sticky left-0 bg-slate-800 border-r border-slate-600 z-30",
    label: "text-xs uppercase tracking-wider",
  },
  
  // Growth indicators
  growth: {
    positive: "text-emerald-600 font-semibold",
    negative: "text-red-600 font-semibold", 
    neutral: "text-slate-500",
    badge: "inline-flex items-center text-xs font-semibold rounded-sm px-1.5 py-0.5",
    badgePositive: "bg-emerald-100 text-emerald-700",
    badgeNegative: "bg-red-100 text-red-700",
    icon: "w-3 h-3 ml-0.5",
  },
  
  // Ranking styles
  ranking: {
    first: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white",
    second: "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800",
    third: "bg-gradient-to-r from-amber-600 to-orange-700 text-white",
    badge: "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
  },
  
  // Metric tabs
  metricTabs: {
    container: "flex flex-wrap gap-2 p-4 bg-white rounded-lg border border-slate-300 shadow-sm",
    label: "flex items-center space-x-2 text-slate-700 font-semibold text-sm mr-4",
    button: "flex items-center space-x-1.5 px-3 py-1.5 rounded-sm font-medium text-sm transition-all duration-200 whitespace-nowrap",
    buttonActive: "bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white shadow-sm",
    buttonInactive: "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200",
  },
  
  // Card wrapper
  card: {
    container: "w-full shadow-lg border border-slate-300 bg-white rounded-lg overflow-hidden",
    header: "bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white p-4",
    headerTitle: "text-lg font-bold text-white",
    headerDescription: "text-slate-300 text-sm font-medium",
    headerIcon: "p-2 bg-white/20 rounded-sm",
    content: "p-0",
  },
} as const;

// Header gradient options for different sections
export const HEADER_GRADIENTS = {
  default: "from-slate-800 via-slate-900 to-slate-800",
  sales: "from-slate-800 via-slate-900 to-slate-800",
  funnel: "from-red-700 via-red-800 to-red-900",
  retention: "from-blue-700 via-blue-800 to-cyan-800",
  trainer: "from-indigo-700 via-purple-800 to-indigo-900",
  class: "from-emerald-700 via-teal-800 to-emerald-900",
  discount: "from-orange-600 via-orange-700 to-red-800",
  expiration: "from-amber-600 via-orange-700 to-amber-800",
  sessions: "from-violet-700 via-purple-800 to-violet-900",
} as const;

// CSS class builder utility
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Get ranking badge styles based on rank
export function getRankingBadgeStyle(rank: number): string {
  if (rank === 1) return TABLE_STYLES.ranking.first;
  if (rank === 2) return TABLE_STYLES.ranking.second;
  if (rank === 3) return TABLE_STYLES.ranking.third;
  return "bg-slate-200 text-slate-700";
}

// Get growth color based on value
export function getGrowthColor(growth: number): string {
  if (growth > 0) return TABLE_STYLES.growth.positive;
  if (growth < 0) return TABLE_STYLES.growth.negative;
  return TABLE_STYLES.growth.neutral;
}

// Get growth badge style
export function getGrowthBadgeStyle(growth: number): string {
  const base = TABLE_STYLES.growth.badge;
  if (growth > 0) return `${base} ${TABLE_STYLES.growth.badgePositive}`;
  if (growth < 0) return `${base} ${TABLE_STYLES.growth.badgeNegative}`;
  return `${base} bg-slate-100 text-slate-600`;
}
