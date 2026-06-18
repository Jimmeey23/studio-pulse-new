export interface MonthlyMetrics {
  booked: number;
  visits: number;
  cancellations: number;
  paidAmount: number;
  unpaidAmount: number;
}

export interface MemberBehaviorData {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  monthlyData: Record<string, MonthlyMetrics>; // Key format: "Nov 2025", "Oct 2025", etc.
}

export interface MemberPerformanceMetrics {
  memberId: string;
  fullName: string;
  email: string;
  totalBookings: number;
  totalVisits: number;
  totalCancellations: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  cancellationRate: number; // cancellations/bookings
  showUpRate: number; // visits/bookings
  paymentCompliance: number; // paid/(paid+unpaid)
  averageTransactionValue: number; // paidAmount/visits
}

export interface MonthlyTrend {
  month: string;
  totalBookings: number;
  totalVisits: number;
  totalCancellations: number;
  totalRevenue: number;
  totalUnpaid: number;
  cancellationRate: number;
  showUpRate: number;
}

export interface MemberSegment {
  memberId: string;
  fullName: string;
  email: string;
  segment: 'high-value' | 'engaged' | 'at-risk' | 'reliable' | 'unreliable' | 'inactive';
  totalRevenue: number;
  visitFrequency: number;
  cancellationRate: number;
  lastActivityMonth?: string;
}

export interface FinancialInsights {
  totalRevenue: number;
  totalOutstanding: number;
  collectionEfficiency: number; // paid/(paid+unpaid)
  revenuePerVisit: number;
  monthlyRevenueData: Array<{
    month: string;
    revenue: number;
    unpaid: number;
  }>;
}

export interface OperationalMetrics {
  overallCancellationRate: number;
  appointmentUtilizationRate: number; // visits/bookings
  totalBookings: number;
  totalVisits: number;
  totalCancellations: number;
  bookingToPaymentConversion: number;
}

export interface PredictiveInsights {
  churnRiskMembers: Array<{
    memberId: string;
    fullName: string;
    email: string;
    churnScore: number; // 0-100, higher = more likely to churn
    declineRate: number;
    lastActiveMonth: string;
  }>;
  revenueForecasts: Array<{
    month: string;
    forecastedRevenue: number;
    confidence: number;
  }>;
  paymentRiskMembers: Array<{
    memberId: string;
    fullName: string;
    email: string;
    unpaidAmount: number;
    paymentComplianceRate: number;
  }>;
}

export interface TrendAnalysis {
  declining: Array<{
    memberId: string;
    fullName: string;
    email: string;
    metric: 'bookings' | 'visits' | 'cancellations';
    changeRate: number; // negative percentage
    recentAvg: number;
    previousAvg: number;
  }>;
  increasing: Array<{
    memberId: string;
    fullName: string;
    email: string;
    metric: 'bookings' | 'visits' | 'cancellations' | 'attendance';
    changeRate: number; // positive percentage
    recentAvg: number;
    previousAvg: number;
  }>;
  correlationInsights: {
    bookingCancellationCorrelation: number; // -1 to 1
    bookingVisitCorrelation: number;
    overallPattern: string;
    highRiskPatterns: Array<{
      pattern: string;
      memberCount: number;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
}

export interface SummaryInsights {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  atRiskMembers: number;
  averageCancellationRate: number;
  averageShowUpRate: number;
  topTrend: string;
  keyInsight: string;
  recommendation: string;
}

export interface MemberBehaviorAnalytics {
  performanceMetrics: MemberPerformanceMetrics[];
  monthlyTrends: MonthlyTrend[];
  memberSegments: MemberSegment[];
  financialInsights: FinancialInsights;
  operationalMetrics: OperationalMetrics;
  predictiveInsights: PredictiveInsights;
  trendAnalysis: TrendAnalysis;
  summaryInsights: SummaryInsights;
}
