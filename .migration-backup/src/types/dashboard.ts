export interface SalesData {
  memberId: string;
  customerName: string;
  customerEmail: string;
  saleItemId: string;
  salesItemId?: string;
  itemId?: string;
  paymentCategory: string;
  membershipType: string;
  paymentDate: string;
  paymentValue: number;
  paidInMoneyCredits: number;
  paymentVAT: number;
  paymentItem: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentTransactionId: string;
  transactionId?: string;
  stripeToken: string;
  soldBy: string;
  saleReference: string;
  calculatedLocation: string;
  cleanedProduct: string;
  cleanedCategory: string;
  
  // Additional derived fields
  netRevenue: number;
  vat: number;
  grossRevenue: number;
  mrpPreTax?: number;
  mrpPostTax?: number;
  discountAmount?: number;
  discountPercentage?: number;
  discountSource?: 'sheet' | 'item_unit' | 'mrp_gap' | 'percentage_derived' | 'effective_mrp' | 'none';
  discountIsEstimated?: boolean;
  discountType?: string;
  discountCode?: string;
  isPromotional?: boolean;
  hostId?: string;
  // Secondary (Sec.) fields for membership/session usage behavior
  secMembershipStartDate?: string;
  secMembershipEndDate?: string;
  secMembershipTotalClasses?: number;
  secMembershipClassesLeft?: number;
  secMembershipUsedSessions?: number;
  secMembershipIsFreezed?: boolean | string; // TRUE/FALSE or boolean
}

export interface SessionData {
  sessionId: string;
  date: string;
  time: string;
  classType: string;
  cleanedClass: string;
  instructor: string;
  location: string;
  capacity: number;
  booked: number;
  checkedIn: number;
  checkedInCount: number;
  waitlisted: number;
  waitlist: number;
  noShows: number;
  fillPercentage: number;
  sessionCount: number;
  totalAttendees: number;
  uniqueId1?: string;
  uniqueId2?: string;
  classes?: string;
  sessionName?: string;
}

export interface NewClientData {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  firstVisitDate: string;
  firstVisitEntityName: string;
  firstVisitType: string;
  firstVisitLocation: string;
  paymentMethod: string;
  membershipUsed: string;
  homeLocation: string;
  classNo: number;
  trainerName: string;
  isNew: string;
  visitsPostTrial: number;
  membershipsBoughtPostTrial: string;
  purchaseCountPostTrial: number;
  ltv: number;
  retentionStatus: string;
  conversionStatus: string;
  firstPurchase: string;
  firstPurchaseItem?: string;
  monthYear?: string;
  conversionSpan: number;
  // Optional fields from sheet when present
  noOfVisits?: number;
}

export interface PayrollData {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  location: string;
  cycleSessions: number;
  emptyCycleSessions: number;
  nonEmptyCycleSessions: number;
  cycleCustomers: number;
  cyclePaid: number;
  barreSessions: number;
  emptyBarreSessions: number;
  nonEmptyBarreSessions: number;
  barreCustomers: number;
  barrePaid: number;
  strengthSessions?: number;
  emptyStrengthSessions?: number;
  nonEmptyStrengthSessions?: number;
  strengthCustomers?: number;
  strengthPaid?: number;
  totalSessions: number;
  totalEmptySessions: number;
  totalNonEmptySessions: number;
  totalCustomers: number;
  totalPaid: number;
  monthYear: string;
  unique: string;
  new: number;
  retained: number;
  retention: string;
  converted: number;
  conversion: string;
  conversionRate?: number;
  retentionRate?: number;
  newCustomers?: number;
  classAverageInclEmpty: number;
  classAverageExclEmpty: number;
}

export interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  location: string[];
  category: string[];
  product: string[];
  soldBy: string[];
  paymentMethod: string[];
  minAmount?: number;
  maxAmount?: number;
}

export interface NewClientFilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  location: string[];
  homeLocation: string[];
  trainer: string[];
  paymentMethod: string[];
  retentionStatus: string[];
  conversionStatus: string[];
  isNew: string[];
  minLTV?: number;
  maxLTV?: number;
}

export interface TrainerFilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  location: string[];
  trainer: string[];
  sessionType: string[];
}

export interface MetricCardData {
  title: string;
  value: string;
  change: number;
  description: string;
  calculation: string;
  icon: string;
  rawValue?: number;
  breakdown?: Record<string, any>;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  category?: string;
}

// Generic table data type for flexible table structures
export type TableData = Record<string, any>;

// Sales-specific metric types
export type MetricType = 'revenue' | 'transactions' | 'members' | 'atv' | 'auv' | 'asv' | 'upt';

// Trainer-specific metric types
export type TrainerMetricType =
  | 'totalSessions'
  | 'totalCustomers'
  | 'totalPaid'
  | 'classAverage'
  | 'classAverageExclEmpty'
  | 'classAverageInclEmpty'
  | 'retention'
  | 'conversion'
  | 'retentionRate'
  | 'conversionRate'
  | 'emptySessions'
  | 'nonEmptySessions'
  | 'newMembers'
  | 'cycleSessions'
  | 'barreSessions'
  | 'strengthSessions'
  | 'retainedMembers'
  | 'convertedMembers'
  | 'cycleRevenue'
  | 'barreRevenue'
  | 'revenuePerSession'
  | 'revenuePerCustomer'
  | 'fillRate'
  | 'utilizationRate'
  | 'consistencyScore';

// Year-on-year specific metric types
export type YearOnYearMetricType = 
  | 'revenue' 
  | 'transactions' 
  | 'members' 
  | 'atv' 
  | 'auv' 
  | 'asv' 
  | 'upt'
  | 'vat'
  | 'netRevenue'
  | 'units'
  | 'discountValue'
  | 'discountPercentage'
  | 'discountAmount'
  | 'purchaseFrequency';

// Data table props interface
export interface DataTableProps {
  title: string;
  data: SalesData[];
  type: 'monthly' | 'product' | 'category';
  filters: FilterOptions;
  onRowClick: (row: any) => void;
  collapsedGroups?: Set<string>;
  onGroupToggle?: (groupKey: string) => void;
}

// Enhanced Year-on-Year table props interface
export interface EnhancedYearOnYearTableProps {
  data: SalesData[];
  filters?: FilterOptions;
  onRowClick: (row: any) => void;
  collapsedGroups?: Set<string>;
  onGroupToggle?: (groupKey: string) => void;
  selectedMetric?: YearOnYearMetricType;
}

// Interactive chart props interface
export interface InteractiveChartProps {
  title: string;
  data: SalesData[] | NewClientData[] | ChartDataPoint[];
  type: 'revenue' | 'performance' | 'sessions' | 'newClients';
}

export interface LateCancellationsData {
  memberId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  customerName?: string;
  orderAt?: string;
  location?: string;
  sessionId?: string;
  sessionName?: string;
  teacherName?: string;
  cleanedProduct?: string;
  cleanedCategory?: string;
  cleanedClass?: string;
  paymentMethodName?: string;
  dateIST?: string;
  dayOfWeek?: string;
  time?: string;
  duration?: number;
  capacity?: number;
  checkedIn?: boolean;
  complementary?: boolean;
  month?: string;
  year?: number;
  classNo?: number;
  paidAmount?: number;
  chargedPenaltyAmount?: number;
  isNew?: string;
  hostId?: string;
  reportRunId?: string;
  reportGeneratedAtIST?: string;
  uniqueId1?: string;
  uniqueId2?: string;
  isLateCancelled?: boolean;
  isCancelled?: boolean;
  cancellationType?: string;
  cancelledEvent?: string;
  cancelledDateIST?: string;
  cancelledDay?: string;
  cancelledTime?: string;
  sessionDateIST?: string;
  sessionDay?: string;
  sessionTime?: string;
  cancelledDateTimeISO?: string;
  sessionDateTimeISO?: string;
  timeBeforeClassMinutes?: number;
  timeBeforeClassHours?: number;
  cancellationWindow?: string;
  isSameDayCancellation?: boolean;
  hasPenalty?: boolean;
  tableType?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface DiscountAnalysisData {
  memberId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  location?: string;
  cleanedProduct?: string;
  cleanedCategory?: string;
  mrpPostTax?: number;
  discountAmount?: number;
  discountPercentage?: number;
  paymentDate?: string;
  soldBy?: string;
  paymentValue?: number;
  [key: string]: string | number | undefined;
}

export interface LateCancellationsFilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  location: string[];
  trainer: string[];
  classType: string[];
  productType: string[];
}

export interface ExpirationData {
  uniqueId: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  memberPhone?: string;
  hostId?: string;
  status: string;
  membershipName: string;
  sessionsLimit?: string;
  purchaseDate?: string;
  startDate?: string;
  endDate: string;
  churnedDate?: string;
  amountPaid?: number;
  discountCode?: string;
  discountValue?: number;
  originalAmount?: number;
  soldBy: string;
  createdBy?: string;
  mostRecentVisitDate?: string;
  firstVisitDate?: string;
  totalSessionsCompleted?: number;
  sessionsUsedPct?: number;
  remainingSessions?: number;
  totalCancellations?: number;
  lateCancellations?: number;
  noShows?: number;
  cancellationRate?: number;
  preferredBookingMethod?: string;
  primaryLocation?: string;
  locationsAttended?: string;
  membershipFreezeCount?: number;
  daysFrozen?: number;
  membershipDurationDays?: number;
  daysActive?: number;
  daysSinceLastVisit?: number;
  avgSessionsPerMonth?: number;
  revenuePerSession?: number;
  attendanceRate?: number;
  // Legacy fields kept for backward compat
  homeLocation: string;
  currentUsage: string;
  id: string;
  orderAt: string;
  membershipId: string;
  frozen: boolean;
  paid: string;
}

export interface ExpirationFilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  location: string[];
  status: string[];
  membershipType: string[];
  soldBy: string[];
}

export interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  type: 'product' | 'category' | 'paymentMethod' | 'metric' | 'member' | 'soldBy' | 'client-conversion' | 'trainer' | 'location' | 'expiration';
  columns: Array<{
    key: string;
    header: string;
    render?: (value: any) => React.ReactNode;
  }>;
}
