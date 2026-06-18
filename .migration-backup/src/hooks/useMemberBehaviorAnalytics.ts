import { useMemo } from 'react';
import {
  MemberBehaviorData,
  MemberBehaviorAnalytics,
  MemberPerformanceMetrics,
  MonthlyTrend,
  MemberSegment,
  FinancialInsights,
  OperationalMetrics,
  PredictiveInsights,
  TrendAnalysis,
  SummaryInsights,
} from '@/types/memberBehavior';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseMemberBehaviorMonth = (value: string): Date | null => {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return new Date(direct.getFullYear(), direct.getMonth(), 1);

  const normalized = value.replace(/[-/]/g, ' ').replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i);

  if (!match) return null;

  const rawMonth = match[1].toLowerCase();
  const year = Number(match[2]);
  const monthIndex = MONTH_LABELS.findIndex(
    (month) => month.toLowerCase() === rawMonth.slice(0, 3).replace('sep', 'sep')
  );

  if (monthIndex < 0 || Number.isNaN(year)) return null;
  return new Date(year, monthIndex, 1);
};

const sortMonthLabelsDesc = (months: string[]) => {
  return [...months].sort((a, b) => {
    const dateA = parseMemberBehaviorMonth(a)?.getTime() ?? 0;
    const dateB = parseMemberBehaviorMonth(b)?.getTime() ?? 0;
    return dateB - dateA;
  });
};

const formatFutureMonth = (date: Date) => `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;

const addMonths = (date: Date, count: number) => new Date(date.getFullYear(), date.getMonth() + count, 1);

export const useMemberBehaviorAnalytics = (
  memberData: MemberBehaviorData[]
): MemberBehaviorAnalytics => {
  return useMemo(() => {
    if (!memberData || memberData.length === 0) {
      return {
        performanceMetrics: [],
        monthlyTrends: [],
        memberSegments: [],
        financialInsights: {
          totalRevenue: 0,
          totalOutstanding: 0,
          collectionEfficiency: 0,
          revenuePerVisit: 0,
          monthlyRevenueData: [],
        },
        operationalMetrics: {
          overallCancellationRate: 0,
          appointmentUtilizationRate: 0,
          totalBookings: 0,
          totalVisits: 0,
          totalCancellations: 0,
          bookingToPaymentConversion: 0,
        },
        predictiveInsights: {
          churnRiskMembers: [],
          revenueForecasts: [],
          paymentRiskMembers: [],
        },
        trendAnalysis: {
          declining: [],
          increasing: [],
          correlationInsights: {
            bookingCancellationCorrelation: 0,
            bookingVisitCorrelation: 0,
            overallPattern: 'No data available',
            highRiskPatterns: [],
          },
        },
        summaryInsights: {
          totalMembers: 0,
          activeMembers: 0,
          inactiveMembers: 0,
          atRiskMembers: 0,
          averageCancellationRate: 0,
          averageShowUpRate: 0,
          topTrend: 'No data available',
          keyInsight: 'No data available',
          recommendation: 'No data available',
        },
      };
    }

    // 1. Calculate Performance Metrics for each member
    const performanceMetrics: MemberPerformanceMetrics[] = memberData.map(member => {
      let totalBookings = 0;
      let totalVisits = 0;
      let totalCancellations = 0;
      let totalPaidAmount = 0;
      let totalUnpaidAmount = 0;

      Object.values(member.monthlyData).forEach(metrics => {
        totalBookings += metrics.booked;
        totalVisits += metrics.visits;
        totalCancellations += metrics.cancellations;
        totalPaidAmount += metrics.paidAmount;
        totalUnpaidAmount += metrics.unpaidAmount;
      });

      const cancellationRate = totalBookings > 0 ? (totalCancellations / totalBookings) * 100 : 0;
      const showUpRate = totalBookings > 0 ? (totalVisits / totalBookings) * 100 : 0;
      const totalAmount = totalPaidAmount + totalUnpaidAmount;
      const paymentCompliance = totalAmount > 0 ? (totalPaidAmount / totalAmount) * 100 : 0;
      const averageTransactionValue = totalVisits > 0 ? totalPaidAmount / totalVisits : 0;

      return {
        memberId: member.memberId,
        fullName: `${member.firstName} ${member.lastName}`.trim(),
        email: member.email,
        totalBookings,
        totalVisits,
        totalCancellations,
        totalPaidAmount,
        totalUnpaidAmount,
        cancellationRate,
        showUpRate,
        paymentCompliance,
        averageTransactionValue,
      };
    });

    // 2. Calculate Monthly Trends
    const monthlyTrendsMap: Record<string, {
      bookings: number;
      visits: number;
      cancellations: number;
      revenue: number;
      unpaid: number;
    }> = {};

    memberData.forEach(member => {
      Object.entries(member.monthlyData).forEach(([month, metrics]) => {
        if (!monthlyTrendsMap[month]) {
          monthlyTrendsMap[month] = {
            bookings: 0,
            visits: 0,
            cancellations: 0,
            revenue: 0,
            unpaid: 0,
          };
        }
        monthlyTrendsMap[month].bookings += metrics.booked;
        monthlyTrendsMap[month].visits += metrics.visits;
        monthlyTrendsMap[month].cancellations += metrics.cancellations;
        monthlyTrendsMap[month].revenue += metrics.paidAmount;
        monthlyTrendsMap[month].unpaid += metrics.unpaidAmount;
      });
    });

    const monthlyTrends: MonthlyTrend[] = Object.entries(monthlyTrendsMap)
      .map(([month, data]) => ({
        month,
        totalBookings: data.bookings,
        totalVisits: data.visits,
        totalCancellations: data.cancellations,
        totalRevenue: data.revenue,
        totalUnpaid: data.unpaid,
        cancellationRate: data.bookings > 0 ? (data.cancellations / data.bookings) * 100 : 0,
        showUpRate: data.bookings > 0 ? (data.visits / data.bookings) * 100 : 0,
      }))
      .sort((a, b) => {
        const dateA = parseMemberBehaviorMonth(a.month)?.getTime() ?? 0;
        const dateB = parseMemberBehaviorMonth(b.month)?.getTime() ?? 0;
        return dateB - dateA;
      });

    // 3. Member Segmentation
    const memberSegments: MemberSegment[] = performanceMetrics.map(metric => {
      // Get last activity month
      const member = memberData.find(m => m.memberId === metric.memberId);
      const monthKeys = member ? sortMonthLabelsDesc(Object.keys(member.monthlyData)) : [];
      
      const lastActivityMonth = monthKeys.find(month => {
        const data = member?.monthlyData[month];
        return data && (data.visits > 0 || data.booked > 0);
      });

      // Determine segment
      let segment: MemberSegment['segment'] = 'inactive';
      
      if (metric.totalPaidAmount > 20000) {
        segment = 'high-value';
      } else if (metric.totalVisits >= 20 && metric.showUpRate >= 80) {
        segment = 'engaged';
      } else if (metric.cancellationRate > 30 || metric.paymentCompliance < 70) {
        segment = 'unreliable';
      } else if (metric.totalVisits >= 10 && metric.showUpRate >= 70) {
        segment = 'reliable';
      } else if (metric.totalVisits < 5 || !lastActivityMonth) {
        segment = 'inactive';
      } else if (metric.showUpRate < 60 || metric.totalVisits < 10) {
        segment = 'at-risk';
      }

      return {
        memberId: metric.memberId,
        fullName: metric.fullName,
        email: metric.email,
        segment,
        totalRevenue: metric.totalPaidAmount,
        visitFrequency: metric.totalVisits,
        cancellationRate: metric.cancellationRate,
        lastActivityMonth,
      };
    });

    // 4. Financial Insights
    const totalRevenue = performanceMetrics.reduce((sum, m) => sum + m.totalPaidAmount, 0);
    const totalOutstanding = performanceMetrics.reduce((sum, m) => sum + m.totalUnpaidAmount, 0);
    const totalAmount = totalRevenue + totalOutstanding;
    const collectionEfficiency = totalAmount > 0 ? (totalRevenue / totalAmount) * 100 : 0;
    const totalVisits = performanceMetrics.reduce((sum, m) => sum + m.totalVisits, 0);
    const revenuePerVisit = totalVisits > 0 ? totalRevenue / totalVisits : 0;

    const monthlyRevenueData = monthlyTrends.map(trend => ({
      month: trend.month,
      revenue: trend.totalRevenue,
      unpaid: trend.totalUnpaid,
    }));

    const financialInsights: FinancialInsights = {
      totalRevenue,
      totalOutstanding,
      collectionEfficiency,
      revenuePerVisit,
      monthlyRevenueData,
    };

    // 5. Operational Metrics
    const totalBookings = performanceMetrics.reduce((sum, m) => sum + m.totalBookings, 0);
    const totalCancellations = performanceMetrics.reduce((sum, m) => sum + m.totalCancellations, 0);
    const overallCancellationRate = totalBookings > 0 ? (totalCancellations / totalBookings) * 100 : 0;
    const appointmentUtilizationRate = totalBookings > 0 ? (totalVisits / totalBookings) * 100 : 0;
    const bookingToPaymentConversion = totalBookings > 0 ? (totalRevenue / totalBookings) : 0;

    const operationalMetrics: OperationalMetrics = {
      overallCancellationRate,
      appointmentUtilizationRate,
      totalBookings,
      totalVisits,
      totalCancellations,
      bookingToPaymentConversion,
    };

    // 6. Predictive Insights
    // Churn Risk: members with declining visit patterns
    const churnRiskMembers = memberData
      .map(member => {
        const months = sortMonthLabelsDesc(Object.keys(member.monthlyData));
        
        const recent3Months = months.slice(0, 3);
        const previous3Months = months.slice(3, 6);
        
        const recentVisits = recent3Months.reduce((sum, m) => sum + (member.monthlyData[m]?.visits || 0), 0);
        const previousVisits = previous3Months.reduce((sum, m) => sum + (member.monthlyData[m]?.visits || 0), 0);
        
        const declineRate = previousVisits > 0 ? ((previousVisits - recentVisits) / previousVisits) * 100 : 0;
        const churnScore = Math.min(100, Math.max(0, declineRate * 2));
        
        const lastActiveMonth = months.find(m => (member.monthlyData[m]?.visits || 0) > 0) || '';
        
        return {
          memberId: member.memberId,
          fullName: `${member.firstName} ${member.lastName}`.trim(),
          email: member.email,
          churnScore,
          declineRate,
          lastActiveMonth,
        };
      })
      .filter(m => m.churnScore > 40)
      .sort((a, b) => b.churnScore - a.churnScore)
      .slice(0, 20);

    // Revenue Forecasts: simple linear projection
    const recentMonths = monthlyTrends.slice(0, 6);
    const recentMonthsAsc = [...recentMonths].reverse();
    const avgRevenue = recentMonths.reduce((sum, m) => sum + m.totalRevenue, 0) / (recentMonths.length || 1);
    const latestActualMonth = parseMemberBehaviorMonth(monthlyTrends[0]?.month || '') ?? new Date();
    const latestRevenue = monthlyTrends[0]?.totalRevenue || avgRevenue;
    const monthlyGrowthRates = recentMonthsAsc
      .slice(1)
      .map((month, index) => {
        const previousRevenue = recentMonthsAsc[index]?.totalRevenue || 0;
        if (previousRevenue <= 0) return 0;
        const rawRate = (month.totalRevenue - previousRevenue) / previousRevenue;
        return Math.max(-0.2, Math.min(0.2, rawRate));
      });

    const averageGrowthRate = monthlyGrowthRates.length > 0
      ? monthlyGrowthRates.reduce((sum, value) => sum + value, 0) / monthlyGrowthRates.length
      : 0.03;

    const dataDepthPenalty = Math.max(0, 6 - recentMonths.length) * 4;
    const volatilityPenalty = Math.min(12, monthlyGrowthRates.reduce((sum, value) => sum + Math.abs(value), 0) * 10);
    const baseConfidence = Math.max(58, Math.round(84 - dataDepthPenalty - volatilityPenalty));

    let projectedRevenue = latestRevenue || avgRevenue;
    const revenueForecasts = Array.from({ length: 3 }, (_, index) => {
      const taperedGrowth = averageGrowthRate * Math.max(0.5, 1 - index * 0.18);
      projectedRevenue = Math.max(0, projectedRevenue * (1 + taperedGrowth));

      return {
        month: formatFutureMonth(addMonths(latestActualMonth, index + 1)),
        forecastedRevenue: projectedRevenue,
        confidence: Math.max(55, baseConfidence - index * 9),
      };
    });

    // Payment Risk: members with high unpaid amounts
    const paymentRiskMembers = performanceMetrics
      .filter(m => m.totalUnpaidAmount > 0)
      .map(m => ({
        memberId: m.memberId,
        fullName: m.fullName,
        email: m.email,
        unpaidAmount: m.totalUnpaidAmount,
        paymentComplianceRate: m.paymentCompliance,
      }))
      .sort((a, b) => b.unpaidAmount - a.unpaidAmount)
      .slice(0, 20);

    const predictiveInsights: PredictiveInsights = {
      churnRiskMembers,
      revenueForecasts,
      paymentRiskMembers,
    };

    // 7. Trend Analysis
    const declining: TrendAnalysis['declining'] = [];
    const increasing: TrendAnalysis['increasing'] = [];

    memberData.forEach(member => {
      const months = sortMonthLabelsDesc(Object.keys(member.monthlyData));
      
      if (months.length < 6) return; // Need at least 6 months for trend analysis
      
      const recent3Months = months.slice(0, 3);
      const previous3Months = months.slice(3, 6);
      
      // Calculate averages for bookings, visits, cancellations
      const recentBookings = recent3Months.reduce((sum, m) => sum + (member.monthlyData[m]?.booked || 0), 0) / 3;
      const previousBookings = previous3Months.reduce((sum, m) => sum + (member.monthlyData[m]?.booked || 0), 0) / 3;
      
      const recentVisits = recent3Months.reduce((sum, m) => sum + (member.monthlyData[m]?.visits || 0), 0) / 3;
      const previousVisits = previous3Months.reduce((sum, m) => sum + (member.monthlyData[m]?.visits || 0), 0) / 3;
      
      const recentCancellations = recent3Months.reduce((sum, m) => sum + (member.monthlyData[m]?.cancellations || 0), 0) / 3;
      const previousCancellations = previous3Months.reduce((sum, m) => sum + (member.monthlyData[m]?.cancellations || 0), 0) / 3;
      
      const fullName = `${member.firstName} ${member.lastName}`.trim();
      
      // Check for declining bookings
      if (previousBookings > 0 && recentBookings < previousBookings) {
        const changeRate = ((recentBookings - previousBookings) / previousBookings) * 100;
        if (changeRate < -15) { // Significant decline
          declining.push({
            memberId: member.memberId,
            fullName,
            email: member.email,
            metric: 'bookings',
            changeRate,
            recentAvg: recentBookings,
            previousAvg: previousBookings,
          });
        }
      }
      
      // Check for declining visits
      if (previousVisits > 0 && recentVisits < previousVisits) {
        const changeRate = ((recentVisits - previousVisits) / previousVisits) * 100;
        if (changeRate < -15) {
          declining.push({
            memberId: member.memberId,
            fullName,
            email: member.email,
            metric: 'visits',
            changeRate,
            recentAvg: recentVisits,
            previousAvg: previousVisits,
          });
        }
      }
      
      // Check for increasing cancellations (negative trend)
      if (previousCancellations >= 0 && recentCancellations > previousCancellations) {
        const changeRate = previousCancellations > 0 
          ? ((recentCancellations - previousCancellations) / previousCancellations) * 100
          : recentCancellations > 0 ? 100 : 0;
        if (changeRate > 20 && recentCancellations >= 1) {
          declining.push({
            memberId: member.memberId,
            fullName,
            email: member.email,
            metric: 'cancellations',
            changeRate: -changeRate, // Make negative to indicate it's a bad trend
            recentAvg: recentCancellations,
            previousAvg: previousCancellations,
          });
        }
      }
      
      // Check for increasing bookings (positive trend)
      if (previousBookings >= 0 && recentBookings > previousBookings) {
        const changeRate = previousBookings > 0
          ? ((recentBookings - previousBookings) / previousBookings) * 100
          : recentBookings > 0 ? 100 : 0;
        if (changeRate > 15) {
          increasing.push({
            memberId: member.memberId,
            fullName,
            email: member.email,
            metric: 'bookings',
            changeRate,
            recentAvg: recentBookings,
            previousAvg: previousBookings,
          });
        }
      }
      
      // Check for increasing visits (positive trend)
      if (previousVisits >= 0 && recentVisits > previousVisits) {
        const changeRate = previousVisits > 0
          ? ((recentVisits - previousVisits) / previousVisits) * 100
          : recentVisits > 0 ? 100 : 0;
        if (changeRate > 15) {
          increasing.push({
            memberId: member.memberId,
            fullName,
            email: member.email,
            metric: 'attendance',
            changeRate,
            recentAvg: recentVisits,
            previousAvg: previousVisits,
          });
        }
      }
    });

    // Calculate correlation between bookings and cancellations
    const calculateCorrelation = (x: number[], y: number[]): number => {
      const n = x.length;
      if (n === 0) return 0;
      
      const meanX = x.reduce((sum, val) => sum + val, 0) / n;
      const meanY = y.reduce((sum, val) => sum + val, 0) / n;
      
      let numerator = 0;
      let sumXSquared = 0;
      let sumYSquared = 0;
      
      for (let i = 0; i < n; i++) {
        const diffX = x[i] - meanX;
        const diffY = y[i] - meanY;
        numerator += diffX * diffY;
        sumXSquared += diffX * diffX;
        sumYSquared += diffY * diffY;
      }
      
      const denominator = Math.sqrt(sumXSquared * sumYSquared);
      return denominator === 0 ? 0 : numerator / denominator;
    };

    const bookingsData: number[] = [];
    const cancellationsData: number[] = [];
    const visitsData: number[] = [];

    memberData.forEach(member => {
      Object.values(member.monthlyData).forEach(metrics => {
        if (metrics.booked > 0) {
          bookingsData.push(metrics.booked);
          cancellationsData.push(metrics.cancellations);
          visitsData.push(metrics.visits);
        }
      });
    });

    const bookingCancellationCorrelation = calculateCorrelation(bookingsData, cancellationsData);
    const bookingVisitCorrelation = calculateCorrelation(bookingsData, visitsData);

    // Determine overall pattern
    let overallPattern = 'Neutral booking behavior';
    if (bookingCancellationCorrelation > 0.5) {
      overallPattern = 'Higher bookings correlate with more cancellations (potential over-booking)';
    } else if (bookingCancellationCorrelation < -0.3) {
      overallPattern = 'Higher bookings correlate with fewer cancellations (reliable bookers)';
    }
    if (bookingVisitCorrelation > 0.7) {
      overallPattern += ' | Strong booking-to-visit conversion';
    } else if (bookingVisitCorrelation < 0.5) {
      overallPattern += ' | Weak booking-to-visit conversion';
    }

    // Identify high-risk patterns
    const highRiskPatterns: TrendAnalysis['correlationInsights']['highRiskPatterns'] = [];
    
    const highCancellationMembers = performanceMetrics.filter(m => m.cancellationRate > 30).length;
    if (highCancellationMembers > memberData.length * 0.1) {
      highRiskPatterns.push({
        pattern: `${highCancellationMembers} members with >30% cancellation rate`,
        memberCount: highCancellationMembers,
        severity: 'high',
      });
    }
    
    const lowShowUpMembers = performanceMetrics.filter(m => m.showUpRate < 60).length;
    if (lowShowUpMembers > memberData.length * 0.15) {
      highRiskPatterns.push({
        pattern: `${lowShowUpMembers} members with <60% show-up rate`,
        memberCount: lowShowUpMembers,
        severity: 'medium',
      });
    }
    
    const decliningBookingMembers = declining.filter(d => d.metric === 'bookings').length;
    if (decliningBookingMembers > 10) {
      highRiskPatterns.push({
        pattern: `${decliningBookingMembers} members showing declining booking trends`,
        memberCount: decliningBookingMembers,
        severity: 'medium',
      });
    }

    const trendAnalysis: TrendAnalysis = {
      declining: declining.sort((a, b) => a.changeRate - b.changeRate).slice(0, 30),
      increasing: increasing.sort((a, b) => b.changeRate - a.changeRate).slice(0, 30),
      correlationInsights: {
        bookingCancellationCorrelation,
        bookingVisitCorrelation,
        overallPattern,
        highRiskPatterns,
      },
    };

    // 8. Summary Insights
    const activeMembers = memberSegments.filter(m => 
      m.segment !== 'inactive' && m.lastActivityMonth
    ).length;
    const atRiskMembers = memberSegments.filter(m => 
      m.segment === 'at-risk' || m.segment === 'unreliable'
    ).length;

    const avgCancellationRate = performanceMetrics.reduce((sum, m) => sum + m.cancellationRate, 0) / (performanceMetrics.length || 1);
    const avgShowUpRate = performanceMetrics.reduce((sum, m) => sum + m.showUpRate, 0) / (performanceMetrics.length || 1);

    // Determine top trend
    let topTrend = 'Stable member behavior across the board';
    if (declining.length > increasing.length * 1.5) {
      topTrend = `${declining.length} members showing declining engagement - immediate attention needed`;
    } else if (increasing.length > declining.length * 1.5) {
      topTrend = `${increasing.length} members showing improved engagement - positive momentum`;
    } else if (highRiskPatterns.filter(p => p.severity === 'high').length > 0) {
      topTrend = 'High cancellation rates detected across multiple member segments';
    }

    // Key insight
    let keyInsight = `Average cancellation rate is ${avgCancellationRate.toFixed(1)}% with ${avgShowUpRate.toFixed(1)}% show-up rate.`;
    if (bookingCancellationCorrelation > 0.5) {
      keyInsight += ' Strong correlation between bookings and cancellations suggests capacity or scheduling issues.';
    } else if (bookingVisitCorrelation < 0.6) {
      keyInsight += ' Low booking-to-visit conversion indicates follow-up opportunities.';
    }

    // Recommendation
    let recommendation = 'Continue monitoring member engagement patterns.';
    if (atRiskMembers > memberData.length * 0.2) {
      recommendation = `Focus on ${atRiskMembers} at-risk members with targeted retention campaigns.`;
    } else if (declining.length > 15) {
      recommendation = `Implement re-engagement program for ${declining.length} members with declining trends.`;
    } else if (avgCancellationRate > 25) {
      recommendation = 'Review cancellation policies and implement reminder systems to reduce no-shows.';
    }

    const summaryInsights: SummaryInsights = {
      totalMembers: memberData.length,
      activeMembers,
      inactiveMembers: memberData.length - activeMembers,
      atRiskMembers,
      averageCancellationRate: avgCancellationRate,
      averageShowUpRate: avgShowUpRate,
      topTrend,
      keyInsight,
      recommendation,
    };

    return {
      performanceMetrics,
      monthlyTrends,
      memberSegments,
      financialInsights,
      operationalMetrics,
      predictiveInsights,
      trendAnalysis,
      summaryInsights,
    };
  }, [memberData]);
};
