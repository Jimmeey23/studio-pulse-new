
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Target, 
  Activity,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  UserCheck,
  Percent,
  Clock,
  Star,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ExecutiveMetricCardsGridProps {
  data: {
    sales: any[];
    sessions: any[];
    payroll: any[];
    newClients: any[];
    leads: any[];
    discounts?: any[];
    lateCancellations?: any[];
  };
  historical?: {
    sales: any[];
    sessions: any[];
    payroll: any[];
    newClients: any[];
    leads: any[];
    discounts?: any[];
    lateCancellations?: any[];
  };
  yearOverYear?: {
    sales: any[];
    sessions: any[];
    newClients: any[];
    leads: any[];
    discounts?: any[];
    lateCancellations?: any[];
  };
  onMetricClick?: (metricData: any) => void;
}

const iconMap = {
  Users,
  Target,
  Activity,
  ShoppingCart,
  UserCheck,
  Percent,
  Clock,
  Zap,
  TrendingUp,
  BarChart3,
  Minus
};

export const ExecutiveMetricCardsGrid: React.FC<ExecutiveMetricCardsGridProps> = ({ 
  data, 
  historical, 
  yearOverYear,
  onMetricClick 
}) => {
  const metrics = useMemo(() => {
    // Use the actual filtered data that was passed in (already filtered by location/date)
    // Calculate current period metrics from the filtered data
    const currentSales = data.sales || [];
    const currentSessions = data.sessions || [];
    const currentNewClients = data.newClients || [];
    const currentLeads = data.leads || [];
    
    // Use historical data for comparisons (if provided)
    const historicalSales = historical?.sales || [];
    const historicalSessions = historical?.sessions || [];
    const historicalNewClients = historical?.newClients || [];
    const historicalLeads = historical?.leads || [];
    
    // Use year-over-year data for annual comparisons (if provided)
    const yoySales = yearOverYear?.sales || [];
    const yoySessions = yearOverYear?.sessions || [];
    const yoyNewClients = yearOverYear?.newClients || [];
    const yoyLeads = yearOverYear?.leads || [];
    
    // Calculate metrics from filtered data
    const totalRevenue = currentSales.reduce((sum, sale) => sum + (sale.paymentValue || 0), 0);
    const totalVAT = currentSales.reduce((sum, sale) => sum + (sale.paymentVAT || 0), 0);
    const netRevenue = totalRevenue - totalVAT;
    const uniqueMembers = new Set(currentSales.map(sale => sale.memberId)).size;
    const totalSessions = currentSessions.length;
    const totalAttendance = currentSessions.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);
    const totalCapacity = currentSessions.reduce((sum, session) => sum + (session.capacity || 0), 0);
    
    // New client checkins/visits (total attendance for all sessions)
    const checkinsVisits = totalAttendance;
    
    // Empty sessions
    const emptySessions = currentSessions.filter(s => (s.checkedInCount || 0) === 0).length;
    
    // Class average attendance
    const classAverage = totalSessions > 0 ? totalAttendance / totalSessions : 0;
    
    // Fill rate
    const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
    
    // Discount amount and percentage
    // Note: totalRevenue = paymentValue (net revenue after discount, before VAT)
    const salesDiscountAmount = currentSales?.reduce((sum, sale) => sum + (sale.discountAmount || 0), 0) || 0;
    const discountAmount = data.discounts?.reduce((sum, d) => sum + (d.discountAmount || 0), 0) || 0;
    const finalDiscountAmount = discountAmount > 0 ? discountAmount : salesDiscountAmount;
    // Calculate discount % correctly: discounts as % of gross revenue (before discount)
    // Gross revenue = Net revenue (paymentValue) + Discounts given
    const grossRevenue = totalRevenue + finalDiscountAmount;
    const discountPercentage = grossRevenue > 0 ? (finalDiscountAmount / grossRevenue) * 100 : 0;
    
    // Late cancellations (from lateCancellations data)
    const lateCancellations = data.lateCancellations?.length || 0;
    
    // PowerCycle, Strength Lab, and Barre sessions count
    const powerCycleSessions = currentSessions.filter(s => 
      s.cleanedClass?.toLowerCase().includes('cycle') || 
      s.classType?.toLowerCase().includes('cycle') ||
      s.cleanedClass?.toLowerCase().includes('power')
    ).length;
    
    const strengthLabSessions = currentSessions.filter(s => 
      s.cleanedClass?.toLowerCase().includes('strength') || 
      s.classType?.toLowerCase().includes('strength') ||
      s.cleanedClass?.toLowerCase().includes('lab')
    ).length;
    
    const barreSessions = currentSessions.filter(s => 
      s.cleanedClass?.toLowerCase().includes('barre') || 
      s.classType?.toLowerCase().includes('barre')
    ).length;

    // Previous period values from historical data (if provided)
    const h = historical || { sales: [], sessions: [], newClients: [], leads: [], payroll: [], discounts: [], lateCancellations: [] };
    const salesPrev = historicalSales;
    const salesPrevRevenue = salesPrev.reduce((sum: number, s: any) => sum + (s.paymentValue || 0), 0);
    const salesPrevVAT = salesPrev.reduce((sum: number, s: any) => sum + (s.paymentVAT || 0), 0);
    const salesPrevNet = salesPrevRevenue - salesPrevVAT;
    const salesPrevUniqueMembers = new Set(salesPrev.map((s: any) => s.memberId)).size;

    const sessionsPrev = historicalSessions;
    const sessionsPrevAttendance = sessionsPrev.reduce((sum: number, s: any) => sum + (s.checkedInCount || 0), 0);
    const sessionsPrevCapacity = sessionsPrev.reduce((sum: number, s: any) => sum + (s.capacity || 0), 0);
    const sessionsPrevLength = sessionsPrev.length;
    const sessionsPrevEmpty = sessionsPrev.filter((s: any) => (s.checkedInCount || 0) === 0).length;
    const sessionsPrevAvgSize = sessionsPrevLength > 0 ? sessionsPrevAttendance / sessionsPrevLength : 0;
    const sessionsPrevFillRate = sessionsPrevCapacity > 0 ? (sessionsPrevAttendance / sessionsPrevCapacity) * 100 : 0;
    
    // Previous period class type sessions
    const sessionsPrevPowerCycle = sessionsPrev.filter((s: any) => 
      s.cleanedClass?.toLowerCase().includes('cycle') || s.classType?.toLowerCase().includes('cycle') ||
      s.cleanedClass?.toLowerCase().includes('power')
    ).length;
    
    const sessionsPrevStrength = sessionsPrev.filter((s: any) => 
      s.cleanedClass?.toLowerCase().includes('strength') || s.classType?.toLowerCase().includes('strength') ||
      s.cleanedClass?.toLowerCase().includes('lab')
    ).length;
    
    const sessionsPrevBarre = sessionsPrev.filter((s: any) => 
      s.cleanedClass?.toLowerCase().includes('barre') || s.classType?.toLowerCase().includes('barre')
    ).length;

    // Previous discount calculations
    const discountsPrev = (historical?.discounts && historical.discounts.length ? historical.discounts : historicalSales);
    const discountPrevAmount = discountsPrev.reduce((sum: number, d: any) => sum + (d.discountAmount || 0), 0);
    // Calculate discount % correctly using gross revenue
    const grossPrevRevenue = salesPrevRevenue + discountPrevAmount;
    const discountPrevPercentage = grossPrevRevenue > 0 ? (discountPrevAmount / grossPrevRevenue) * 100 : 0;
    
    // Previous late cancellations
    const lateCancelPrev = historical?.lateCancellations?.length || 0;

    // Year-over-year calculations for same month last year
    const yoyRevenue = yoySales.reduce((sum: number, s: any) => sum + (s.paymentValue || 0), 0);
    const yoyVAT = yoySales.reduce((sum: number, s: any) => sum + (s.paymentVAT || 0), 0);
    const yoyNetRevenue = yoyRevenue - yoyVAT;
    const yoyUniqueMembers = new Set(yoySales.map((s: any) => s.memberId)).size;
    const yoyAttendance = yoySessions.reduce((sum: number, s: any) => sum + (s.checkedInCount || 0), 0);
    const yoyTotalSessions = yoySessions.length;
    const yoyCapacity = yoySessions.reduce((sum: number, s: any) => sum + (s.capacity || 0), 0);
    const yoyEmptySessions = yoySessions.filter((s: any) => (s.checkedInCount || 0) === 0).length;
    const yoyAvgClassSize = yoyTotalSessions > 0 ? yoyAttendance / yoyTotalSessions : 0;
    const yoyFillRate = yoyCapacity > 0 ? (yoyAttendance / yoyCapacity) * 100 : 0;
    
    const yoyPowerCycleSessions = yoySessions.filter((s: any) => 
      s.cleanedClass?.toLowerCase().includes('cycle') || s.classType?.toLowerCase().includes('cycle') ||
      s.cleanedClass?.toLowerCase().includes('power')
    ).length;
    
    const yoyStrengthSessions = yoySessions.filter((s: any) => 
      s.cleanedClass?.toLowerCase().includes('strength') || s.classType?.toLowerCase().includes('strength') ||
      s.cleanedClass?.toLowerCase().includes('lab')
    ).length;
    
    const yoyBarreSessions = yoySessions.filter((s: any) => 
      s.cleanedClass?.toLowerCase().includes('barre') || s.classType?.toLowerCase().includes('barre')
    ).length;

    const yoyDiscountAmount = (yearOverYear?.discounts && yearOverYear.discounts.length ? 
      yearOverYear.discounts : yoySales).reduce((sum: number, d: any) => sum + (d.discountAmount || 0), 0);
    // Calculate YoY discount % correctly using gross revenue
    const yoyGrossRevenue = yoyRevenue + yoyDiscountAmount;
    const yoyDiscountPercentage = yoyGrossRevenue > 0 ? (yoyDiscountAmount / yoyGrossRevenue) * 100 : 0;
    const yoyLateCancellations = yearOverYear?.lateCancellations?.length || 0;

    const growth = (cur: number, prev: number) => {
      if (!isFinite(prev) || prev === 0) return cur > 0 ? 100 : 0;
      return ((cur - prev) / prev) * 100;
    };

    return [
      {
        title: "Net Revenue",
        value: formatCurrency(netRevenue),
        rawValue: netRevenue,
        change: growth(netRevenue, salesPrevNet),
        changeDetails: {
          rate: growth(netRevenue, salesPrevNet),
          isSignificant: Math.abs(growth(netRevenue, salesPrevNet)) > 10,
          trend: growth(netRevenue, salesPrevNet) > 0 
            ? (Math.abs(growth(netRevenue, salesPrevNet)) > 20 ? 'strong' : Math.abs(growth(netRevenue, salesPrevNet)) > 10 ? 'moderate' : 'weak')
            : (Math.abs(growth(netRevenue, salesPrevNet)) > 20 ? 'weak' : Math.abs(growth(netRevenue, salesPrevNet)) > 10 ? 'moderate' : 'weak')
        },
        icon: "TrendingUp",
        color: "emerald",
        description: "Revenue after VAT deduction",
        previousValue: formatCurrency(salesPrevNet),
        previousRawValue: salesPrevNet,
        comparison: {
          current: netRevenue,
          previous: salesPrevNet,
          difference: netRevenue - salesPrevNet
        },
        yoyChange: yoyNetRevenue > 0 ? growth(netRevenue, yoyNetRevenue) : undefined,
        yoyChangeDetails: yoyNetRevenue > 0 ? {
          rate: growth(netRevenue, yoyNetRevenue),
          isSignificant: Math.abs(growth(netRevenue, yoyNetRevenue)) > 10,
          trend: growth(netRevenue, yoyNetRevenue) > 0 
            ? (Math.abs(growth(netRevenue, yoyNetRevenue)) > 20 ? 'strong' : Math.abs(growth(netRevenue, yoyNetRevenue)) > 10 ? 'moderate' : 'weak')
            : (Math.abs(growth(netRevenue, yoyNetRevenue)) > 20 ? 'weak' : Math.abs(growth(netRevenue, yoyNetRevenue)) > 10 ? 'moderate' : 'weak')
        } : undefined,
        yoyPreviousValue: yoyNetRevenue > 0 ? formatCurrency(yoyNetRevenue) : undefined,
        yoyPreviousRawValue: yoyNetRevenue > 0 ? yoyNetRevenue : undefined
      },
      {
        title: "Unique Members",
        value: formatNumber(uniqueMembers),
        rawValue: uniqueMembers,
        change: growth(uniqueMembers, salesPrevUniqueMembers),
        changeDetails: {
          rate: growth(uniqueMembers, salesPrevUniqueMembers),
          isSignificant: Math.abs(growth(uniqueMembers, salesPrevUniqueMembers)) > 10,
          trend: growth(uniqueMembers, salesPrevUniqueMembers) > 0 
            ? (Math.abs(growth(uniqueMembers, salesPrevUniqueMembers)) > 20 ? 'strong' : Math.abs(growth(uniqueMembers, salesPrevUniqueMembers)) > 10 ? 'moderate' : 'weak')
            : (Math.abs(growth(uniqueMembers, salesPrevUniqueMembers)) > 20 ? 'weak' : Math.abs(growth(uniqueMembers, salesPrevUniqueMembers)) > 10 ? 'moderate' : 'weak')
        },
        icon: "Users",
        color: "blue",
        description: "Unique paying members",
        previousValue: formatNumber(salesPrevUniqueMembers),
        previousRawValue: salesPrevUniqueMembers,
        comparison: {
          current: uniqueMembers,
          previous: salesPrevUniqueMembers,
          difference: uniqueMembers - salesPrevUniqueMembers
        },
        yoyChange: yoyUniqueMembers > 0 ? growth(uniqueMembers, yoyUniqueMembers) : undefined,
        yoyChangeDetails: yoyUniqueMembers > 0 ? {
          rate: growth(uniqueMembers, yoyUniqueMembers),
          isSignificant: Math.abs(growth(uniqueMembers, yoyUniqueMembers)) > 10,
          trend: growth(uniqueMembers, yoyUniqueMembers) > 0 
            ? (Math.abs(growth(uniqueMembers, yoyUniqueMembers)) > 20 ? 'strong' : Math.abs(growth(uniqueMembers, yoyUniqueMembers)) > 10 ? 'moderate' : 'weak')
            : (Math.abs(growth(uniqueMembers, yoyUniqueMembers)) > 20 ? 'weak' : Math.abs(growth(uniqueMembers, yoyUniqueMembers)) > 10 ? 'moderate' : 'weak')
        } : undefined,
        yoyPreviousValue: yoyUniqueMembers > 0 ? formatNumber(yoyUniqueMembers) : undefined,
        yoyPreviousRawValue: yoyUniqueMembers > 0 ? yoyUniqueMembers : undefined
      },
      {
        title: "Checkins/Visits",
        value: formatNumber(checkinsVisits),
        rawValue: checkinsVisits,
        change: growth(checkinsVisits, sessionsPrevAttendance),
        changeDetails: {
          rate: growth(checkinsVisits, sessionsPrevAttendance),
          isSignificant: Math.abs(growth(checkinsVisits, sessionsPrevAttendance)) > 10,
          trend: growth(checkinsVisits, sessionsPrevAttendance) > 0 
            ? (Math.abs(growth(checkinsVisits, sessionsPrevAttendance)) > 20 ? 'strong' : Math.abs(growth(checkinsVisits, sessionsPrevAttendance)) > 10 ? 'moderate' : 'weak')
            : (Math.abs(growth(checkinsVisits, sessionsPrevAttendance)) > 20 ? 'weak' : Math.abs(growth(checkinsVisits, sessionsPrevAttendance)) > 10 ? 'moderate' : 'weak')
        },
        icon: "UserCheck",
        color: "green",
        description: "Total class attendance",
        previousValue: formatNumber(sessionsPrevAttendance),
        previousRawValue: sessionsPrevAttendance,
        comparison: {
          current: checkinsVisits,
          previous: sessionsPrevAttendance,
          difference: checkinsVisits - sessionsPrevAttendance
        }
      },
      {
        title: "Sessions",
        value: formatNumber(totalSessions),
        rawValue: totalSessions,
        change: growth(totalSessions, sessionsPrevLength),
        changeDetails: {
          rate: growth(totalSessions, sessionsPrevLength),
          isSignificant: Math.abs(growth(totalSessions, sessionsPrevLength)) > 10,
          trend: growth(totalSessions, sessionsPrevLength) > 0 
            ? (Math.abs(growth(totalSessions, sessionsPrevLength)) > 20 ? 'strong' : Math.abs(growth(totalSessions, sessionsPrevLength)) > 10 ? 'moderate' : 'weak')
            : (Math.abs(growth(totalSessions, sessionsPrevLength)) > 20 ? 'weak' : Math.abs(growth(totalSessions, sessionsPrevLength)) > 10 ? 'moderate' : 'weak')
        },
        icon: "Activity",
        color: "purple",
        description: "Total classes conducted",
        previousValue: formatNumber(sessionsPrevLength),
        previousRawValue: sessionsPrevLength,
        comparison: {
          current: totalSessions,
          previous: sessionsPrevLength,
          difference: totalSessions - sessionsPrevLength
        }
      },
      {
        title: "Empty Sessions",
        value: formatNumber(emptySessions),
        rawValue: emptySessions,
        change: growth(emptySessions, sessionsPrevEmpty),
        changeDetails: {
          rate: growth(emptySessions, sessionsPrevEmpty),
          isSignificant: Math.abs(growth(emptySessions, sessionsPrevEmpty)) > 5,
          trend: growth(emptySessions, sessionsPrevEmpty) > 0 
            ? 'weak' // Increasing empty sessions is bad
            : (Math.abs(growth(emptySessions, sessionsPrevEmpty)) > 20 ? 'strong' : Math.abs(growth(emptySessions, sessionsPrevEmpty)) > 10 ? 'moderate' : 'weak')
        },
        icon: "Minus",
        color: "red",
        description: "Classes with zero attendance",
        previousValue: formatNumber(sessionsPrevEmpty),
        previousRawValue: sessionsPrevEmpty,
        comparison: {
          current: emptySessions,
          previous: sessionsPrevEmpty,
          difference: emptySessions - sessionsPrevEmpty
        }
      },
      {
        title: "Class Average",
        value: formatNumber(classAverage, 1),
        rawValue: classAverage,
        change: growth(classAverage, sessionsPrevAvgSize),
        changeDetails: {
          rate: growth(classAverage, sessionsPrevAvgSize),
          isSignificant: Math.abs(growth(classAverage, sessionsPrevAvgSize)) > 5,
          trend: growth(classAverage, sessionsPrevAvgSize) > 0 
            ? (Math.abs(growth(classAverage, sessionsPrevAvgSize)) > 15 ? 'strong' : Math.abs(growth(classAverage, sessionsPrevAvgSize)) > 5 ? 'moderate' : 'weak')
            : (Math.abs(growth(classAverage, sessionsPrevAvgSize)) > 15 ? 'weak' : Math.abs(growth(classAverage, sessionsPrevAvgSize)) > 5 ? 'moderate' : 'weak')
        },
        icon: "BarChart3",
        color: "indigo",
        description: "Average attendees per class",
        previousValue: formatNumber(sessionsPrevAvgSize, 1),
        previousRawValue: sessionsPrevAvgSize,
        comparison: {
          current: classAverage,
          previous: sessionsPrevAvgSize,
          difference: classAverage - sessionsPrevAvgSize
        }
      },
      {
        title: "Fill Rate",
        value: `${formatNumber(fillRate, 1)}%`,
        rawValue: fillRate,
        change: growth(fillRate, sessionsPrevFillRate),
        changeDetails: {
          rate: growth(fillRate, sessionsPrevFillRate),
          isSignificant: Math.abs(growth(fillRate, sessionsPrevFillRate)) > 5,
          trend: growth(fillRate, sessionsPrevFillRate) > 0 
            ? (Math.abs(growth(fillRate, sessionsPrevFillRate)) > 15 ? 'strong' : Math.abs(growth(fillRate, sessionsPrevFillRate)) > 5 ? 'moderate' : 'weak')
            : (Math.abs(growth(fillRate, sessionsPrevFillRate)) > 15 ? 'weak' : Math.abs(growth(fillRate, sessionsPrevFillRate)) > 5 ? 'moderate' : 'weak')
        },
        icon: "Target",
        color: "teal",
        description: "Capacity utilization rate",
        previousValue: `${formatNumber(sessionsPrevFillRate, 1)}%`,
        previousRawValue: sessionsPrevFillRate,
        comparison: {
          current: fillRate,
          previous: sessionsPrevFillRate,
          difference: fillRate - sessionsPrevFillRate
        }
      },
      {
        title: "Discount Amount",
        value: formatCurrency(finalDiscountAmount),
        rawValue: finalDiscountAmount,
        change: growth(finalDiscountAmount, discountPrevAmount),
        changeDetails: {
          rate: growth(finalDiscountAmount, discountPrevAmount),
          isSignificant: Math.abs(growth(finalDiscountAmount, discountPrevAmount)) > 10,
          trend: growth(finalDiscountAmount, discountPrevAmount) > 0 
            ? 'weak' // Increasing discounts is bad for revenue
            : (Math.abs(growth(finalDiscountAmount, discountPrevAmount)) > 20 ? 'strong' : Math.abs(growth(finalDiscountAmount, discountPrevAmount)) > 10 ? 'moderate' : 'weak')
        },
        icon: "Percent",
        color: "orange",
        description: "Total discount value given",
        previousValue: formatCurrency(discountPrevAmount),
        previousRawValue: discountPrevAmount,
        comparison: {
          current: finalDiscountAmount,
          previous: discountPrevAmount,
          difference: finalDiscountAmount - discountPrevAmount
        }
      },
      {
        title: "Discount %",
        value: `${formatNumber(discountPercentage, 1)}%`,
        rawValue: discountPercentage,
        change: growth(discountPercentage, discountPrevPercentage),
        changeDetails: {
          rate: growth(discountPercentage, discountPrevPercentage),
          isSignificant: Math.abs(growth(discountPercentage, discountPrevPercentage)) > 5,
          trend: growth(discountPercentage, discountPrevPercentage) > 0 
            ? 'weak' // Increasing discount % is bad
            : (Math.abs(growth(discountPercentage, discountPrevPercentage)) > 15 ? 'strong' : Math.abs(growth(discountPercentage, discountPrevPercentage)) > 5 ? 'moderate' : 'weak')
        },
        icon: "Percent",
        color: "yellow",
        description: "Discount as % of revenue",
        previousValue: `${formatNumber(discountPrevPercentage, 1)}%`,
        previousRawValue: discountPrevPercentage,
        comparison: {
          current: discountPercentage,
          previous: discountPrevPercentage,
          difference: discountPercentage - discountPrevPercentage
        }
      },
      {
        title: "Late Cancellations",
        value: formatNumber(lateCancellations),
        rawValue: lateCancellations,
        change: growth(lateCancellations, lateCancelPrev),
        changeDetails: {
          rate: growth(lateCancellations, lateCancelPrev),
          isSignificant: Math.abs(growth(lateCancellations, lateCancelPrev)) > 10,
          trend: growth(lateCancellations, lateCancelPrev) > 0 
            ? 'weak' // Increasing late cancellations is bad
            : (Math.abs(growth(lateCancellations, lateCancelPrev)) > 20 ? 'strong' : Math.abs(growth(lateCancellations, lateCancelPrev)) > 10 ? 'moderate' : 'weak')
        },
        icon: "Clock",
        color: "red",
        description: "Classes cancelled late",
        previousValue: formatNumber(lateCancelPrev),
        previousRawValue: lateCancelPrev,
        comparison: {
          current: lateCancellations,
          previous: lateCancelPrev,
          difference: lateCancellations - lateCancelPrev
        }
      },
      {
        title: "PowerCycle Classes",
        value: formatNumber(powerCycleSessions),
        rawValue: powerCycleSessions,
        change: growth(powerCycleSessions, sessionsPrevPowerCycle),
        changeDetails: {
          rate: growth(powerCycleSessions, sessionsPrevPowerCycle),
          isSignificant: Math.abs(growth(powerCycleSessions, sessionsPrevPowerCycle)) > 10,
          trend: growth(powerCycleSessions, sessionsPrevPowerCycle) > 0 
            ? (Math.abs(growth(powerCycleSessions, sessionsPrevPowerCycle)) > 20 ? 'strong' : Math.abs(growth(powerCycleSessions, sessionsPrevPowerCycle)) > 10 ? 'moderate' : 'weak')
            : (Math.abs(growth(powerCycleSessions, sessionsPrevPowerCycle)) > 20 ? 'weak' : Math.abs(growth(powerCycleSessions, sessionsPrevPowerCycle)) > 10 ? 'moderate' : 'weak')
        },
        icon: "Zap",
        color: "blue",
        description: "Cycle and power classes",
        previousValue: formatNumber(sessionsPrevPowerCycle),
        previousRawValue: sessionsPrevPowerCycle,
        comparison: {
          current: powerCycleSessions,
          previous: sessionsPrevPowerCycle,
          difference: powerCycleSessions - sessionsPrevPowerCycle
        }
      },
      {
        title: "Strength Lab Classes",
        value: formatNumber(strengthLabSessions),
        rawValue: strengthLabSessions,
        change: growth(strengthLabSessions, sessionsPrevStrength),
        changeDetails: {
          rate: growth(strengthLabSessions, sessionsPrevStrength),
          isSignificant: Math.abs(growth(strengthLabSessions, sessionsPrevStrength)) > 10,
          trend: growth(strengthLabSessions, sessionsPrevStrength) > 0 
            ? (Math.abs(growth(strengthLabSessions, sessionsPrevStrength)) > 20 ? 'strong' : Math.abs(growth(strengthLabSessions, sessionsPrevStrength)) > 10 ? 'moderate' : 'weak')
            : (Math.abs(growth(strengthLabSessions, sessionsPrevStrength)) > 20 ? 'weak' : Math.abs(growth(strengthLabSessions, sessionsPrevStrength)) > 10 ? 'moderate' : 'weak')
        },
        icon: "Target",
        color: "gray",
        description: "Strength and lab classes",
        previousValue: formatNumber(sessionsPrevStrength),
        previousRawValue: sessionsPrevStrength,
        comparison: {
          current: strengthLabSessions,
          previous: sessionsPrevStrength,
          difference: strengthLabSessions - sessionsPrevStrength
        }
      },
      {
        title: "Barre Classes",
        value: formatNumber(barreSessions),
        rawValue: barreSessions,
        change: growth(barreSessions, sessionsPrevBarre),
        changeDetails: {
          rate: growth(barreSessions, sessionsPrevBarre),
          isSignificant: Math.abs(growth(barreSessions, sessionsPrevBarre)) > 10,
          trend: growth(barreSessions, sessionsPrevBarre) > 0 
            ? (Math.abs(growth(barreSessions, sessionsPrevBarre)) > 20 ? 'strong' : Math.abs(growth(barreSessions, sessionsPrevBarre)) > 10 ? 'moderate' : 'weak')
            : (Math.abs(growth(barreSessions, sessionsPrevBarre)) > 20 ? 'weak' : Math.abs(growth(barreSessions, sessionsPrevBarre)) > 10 ? 'moderate' : 'weak')
        },
        icon: "Activity",
        color: "pink",
        description: "Barre classes conducted",
        previousValue: formatNumber(sessionsPrevBarre),
        previousRawValue: sessionsPrevBarre,
        comparison: {
          current: barreSessions,
          previous: sessionsPrevBarre,
          difference: barreSessions - sessionsPrevBarre
        }
      }
    ];
  }, [data, historical]);

  // Take the first 12 metrics for the cards (all the important ones)
  const displayMetrics = metrics;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Key Performance Metrics</h2>
        <p className="text-slate-600">Real-time insights from filtered data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayMetrics.map((metric, index) => {
          const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || Activity;
          const isPositive = metric.change > 0;
          const isNegative = metric.change < 0;

          return (
            <Card
              key={metric.title}
              className={cn(
                "group relative overflow-hidden cursor-pointer transition-all duration-500",
                "bg-white hover:bg-gradient-to-br hover:from-slate-900 hover:via-slate-900 hover:to-slate-950",
                "border border-slate-200 hover:border-slate-800 border-t-4",
                "shadow-md hover:shadow-2xl hover:shadow-slate-950/60",
                "hover:-translate-y-1 hover:scale-[1.01]",
                index % 4 === 0 && "border-t-emerald-500",
                index % 4 === 1 && "border-t-blue-500",
                index % 4 === 2 && "border-t-purple-500",
                index % 4 === 3 && "border-t-rose-500",
                onMetricClick && "hover:cursor-pointer"
              )}
              onClick={() => onMetricClick?.({
                ...metric,
                metricType: metric.title.toLowerCase().replace(/\s+/g, '-'),
                specificData: metric,
                drillDownType: 'metric'
              })}
            >
              <CardContent className="p-5 relative">
                {/* Decorative gradient overlay */}
                <div className={cn(
                  "absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500",
                  index % 4 === 0 && "bg-gradient-to-br from-emerald-500 to-teal-500",
                  index % 4 === 1 && "bg-gradient-to-br from-blue-500 to-cyan-500",
                  index % 4 === 2 && "bg-gradient-to-br from-purple-500 to-pink-500",
                  index % 4 === 3 && "bg-gradient-to-br from-rose-500 to-orange-500"
                )} />
                
                {/* Background Icon - Enhanced */}
                <div className="absolute top-3 right-3 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-6">
                  <IconComponent className="w-20 h-20 text-slate-900 group-hover:text-white" />
                </div>
                
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-500" 
                     style={{backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px'}} />
                
                {/* Main Content */}
                <div className="relative z-10 space-y-2.5">
                  {/* Header Section - Icon and Title */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "p-2.5 rounded-xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md",
                        index % 4 === 0 && "bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 text-emerald-700 group-hover:from-emerald-500/25 group-hover:to-emerald-600/20 group-hover:text-emerald-400 group-hover:shadow-emerald-500/20",
                        index % 4 === 1 && "bg-gradient-to-br from-blue-500/15 to-blue-600/10 text-blue-700 group-hover:from-blue-500/25 group-hover:to-blue-600/20 group-hover:text-blue-400 group-hover:shadow-blue-500/20",
                        index % 4 === 2 && "bg-gradient-to-br from-purple-500/15 to-purple-600/10 text-purple-700 group-hover:from-purple-500/25 group-hover:to-purple-600/20 group-hover:text-purple-400 group-hover:shadow-purple-500/20",
                        index % 4 === 3 && "bg-gradient-to-br from-rose-500/15 to-rose-600/10 text-rose-700 group-hover:from-rose-500/25 group-hover:to-rose-600/20 group-hover:text-rose-400 group-hover:shadow-rose-500/20"
                      )}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-bold text-sm text-slate-700 transition-all duration-500 leading-tight",
                          "group-hover:text-white group-hover:underline group-hover:underline-offset-4 group-hover:decoration-2",
                          index % 4 === 0 && "group-hover:decoration-emerald-400",
                          index % 4 === 1 && "group-hover:decoration-blue-400",
                          index % 4 === 2 && "group-hover:decoration-purple-400",
                          index % 4 === 3 && "group-hover:decoration-rose-400"
                        )}>
                          {metric.title}
                        </h3>
                        <p className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors duration-500 mt-0.5 uppercase tracking-wide font-semibold">
                          Current Period
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Value with Background Card */}
                  <div className={cn(
                    "p-2.5 rounded-lg transition-all duration-500",
                    "bg-slate-50 group-hover:bg-slate-800/30",
                    "border border-slate-100 group-hover:border-slate-700/50"
                  )}>
                    <p className="text-3xl font-bold text-slate-900 group-hover:text-white transition-colors duration-500 tracking-tight">
                      {metric.value}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={cn(
                        "h-0.5 flex-1 rounded-full transition-all duration-500",
                        metric.change > 0 && "bg-emerald-200 group-hover:bg-emerald-500/40",
                        metric.change < 0 && "bg-rose-200 group-hover:bg-rose-500/40",
                        metric.change === 0 && "bg-slate-200 group-hover:bg-slate-500/40"
                      )} />
                      <div className="flex items-center gap-1">
                        {metric.change > 0 && <ArrowUpRight className="w-3 h-3 text-emerald-600 group-hover:text-emerald-400" />}
                        {metric.change < 0 && <ArrowDownRight className="w-3 h-3 text-rose-600 group-hover:text-rose-400" />}
                        {metric.change === 0 && <Minus className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />}
                        <span className={cn(
                          "text-[10px] font-bold transition-colors duration-500",
                          metric.change > 0 && "text-emerald-600 group-hover:text-emerald-400",
                          metric.change < 0 && "text-rose-600 group-hover:text-rose-400",
                          metric.change === 0 && "text-slate-600 group-hover:text-slate-400"
                        )}>
                          {metric.changeDetails.trend}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Metrics - Enhanced Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* MoM Card */}
                    <div className={cn(
                      "p-2.5 rounded-lg border transition-all duration-500",
                      "bg-white/50 group-hover:bg-slate-800/20",
                      "border-slate-200 group-hover:border-slate-700/50"
                    )}>
                      <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                        Month over Month
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                          {metric.previousValue ?? '—'}
                        </span>
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">prev</span>
                      </div>
                      <div className={cn(
                        "inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] tabular-nums transition-all duration-500 min-w-[65px]",
                        metric.change > 0 && "bg-emerald-900/90 text-white group-hover:bg-emerald-800 group-hover:shadow-lg group-hover:shadow-emerald-900/40",
                        metric.change < 0 && "bg-rose-900/90 text-white group-hover:bg-rose-800 group-hover:shadow-lg group-hover:shadow-rose-900/40",
                        metric.change === 0 && "bg-slate-700/90 text-white group-hover:bg-slate-600 group-hover:shadow-lg"
                      )}>
                        {metric.change > 0 && <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />}
                        {metric.change < 0 && <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />}
                        {metric.change === 0 && <Minus className="w-3.5 h-3.5 flex-shrink-0" />}
                        <span>{typeof metric.change === 'number' ? (metric.change > 0 ? '+' : '') + Math.round(metric.change) + '%' : 'N/A'}</span>
                      </div>
                    </div>
                    
                    {/* YoY Card - Year over Year Comparison */}
                    <div className={cn(
                      "p-2.5 rounded-lg border transition-all duration-500",
                      metric.yoyChange !== undefined 
                        ? "bg-white/50 group-hover:bg-slate-800/20 border-slate-200 group-hover:border-slate-700/50"
                        : "bg-slate-50/50 group-hover:bg-slate-800/10 border-slate-200 group-hover:border-slate-700/30"
                    )}>
                      {metric.yoyChange != null ? (
                        <>
                          <div className="text-[9px] font-bold text-slate-500 group-hover:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-500">
                            Year over Year
                          </div>
                          <div className="flex items-baseline gap-1.5 mb-1.5">
                            <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors duration-500 tabular-nums">
                              {metric.yoyPreviousValue}
                            </span>
                            <span className="text-[8px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500">last year</span>
                          </div>
                          <div className={cn(
                            "inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] tabular-nums transition-all duration-500 min-w-[65px]",
                            metric.yoyChange > 0 && "bg-emerald-900/90 text-white group-hover:bg-emerald-800 group-hover:shadow-lg group-hover:shadow-emerald-900/40",
                            metric.yoyChange < 0 && "bg-rose-900/90 text-white group-hover:bg-rose-800 group-hover:shadow-lg group-hover:shadow-rose-900/40",
                            metric.yoyChange === 0 && "bg-slate-700/90 text-white group-hover:bg-slate-600 group-hover:shadow-lg"
                          )}>
                            {metric.yoyChange > 0 && <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />}
                            {metric.yoyChange < 0 && <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />}
                            {metric.yoyChange === 0 && <Minus className="w-3.5 h-3.5 flex-shrink-0" />}
                            <span>{typeof metric.yoyChange === 'number' ? (metric.yoyChange > 0 ? '+' : '') + Math.round(metric.yoyChange) + '%' : 'N/A'}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-500 transition-colors duration-500 font-semibold">
                          No YoY Data
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description Footer with Enhanced Side Border */}
                  <div className={cn(
                    "relative pt-1.5 border-l-3 pl-3 transition-all duration-500",
                    "before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:rounded-r-full before:transition-all before:duration-500",
                    index % 4 === 0 && "border-l-emerald-500/50 group-hover:border-l-emerald-400 before:bg-emerald-500/20 group-hover:before:bg-emerald-400/30",
                    index % 4 === 1 && "border-l-blue-500/50 group-hover:border-l-blue-400 before:bg-blue-500/20 group-hover:before:bg-blue-400/30",
                    index % 4 === 2 && "border-l-purple-500/50 group-hover:border-l-purple-400 before:bg-purple-500/20 group-hover:before:bg-purple-400/30",
                    index % 4 === 3 && "border-l-rose-500/50 group-hover:border-l-rose-400 before:bg-rose-500/20 group-hover:before:bg-rose-400/30"
                  )}>
                    <p className="text-xs text-slate-600 group-hover:text-slate-300 leading-snug transition-colors duration-500 line-clamp-2 font-medium">
                      {metric.description}
                    </p>
                  </div>

                  {/* Additional Info - Hidden by default, shown on hover */}
                  <div className={cn(
                    "pt-2 space-y-2 border-t transition-all duration-500 overflow-hidden",
                    "max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100",
                    index % 4 === 0 && "border-emerald-200 group-hover:border-emerald-500/30",
                    index % 4 === 1 && "border-blue-200 group-hover:border-blue-500/30",
                    index % 4 === 2 && "border-purple-200 group-hover:border-purple-500/30",
                    index % 4 === 3 && "border-rose-200 group-hover:border-rose-500/30"
                  )}>
                    {/* Trend Info */}
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Trend:</span>
                        <span className="text-white font-semibold">{metric.changeDetails.trend}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Difference:</span>
                        <span className="text-white font-semibold">{formatCurrency(Math.abs(metric.comparison.difference))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Action Dashboard Button */}
      <div className="flex justify-center mt-8">
        <Button 
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          View Detailed Dashboard
        </Button>
      </div>
    </div>
  );
};
