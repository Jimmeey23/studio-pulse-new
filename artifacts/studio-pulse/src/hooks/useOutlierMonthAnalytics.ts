import { useMemo } from 'react';
import { SalesData, NewClientData } from '@/types/dashboard';
import { CheckinData } from './useCheckinsData';

export interface DailyAnalytics {
  date: string;
  revenue: number;
  newClientRevenue: number;
  existingClientRevenue: number;
  activeMembershipRevenue: number;
  transactions: number;
  newClients: number;
  existingClients: number;
  renewals: number;
  upgrades: number;
  downgrades: number;
  stacking: number;
}

export interface MembershipAnalytics {
  membershipName: string;
  cleanedCategory: string;
  revenue: number;
  count: number;
  avgPrice: number;
  newClients: number;
  existingClients: number;
  renewals: number;
  upgrades: number;
  downgrades: number;
}

export interface SpenderData {
  memberId: string;
  customerName: string;
  customerEmail: string;
  totalSpent: number;
  transactions: number;
  avgTransaction: number;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  isNew: boolean;
  lastMembershipName?: string;
  lastMembershipEndDate?: string;
  membershipStatus?: 'Active' | 'Expired' | 'Frozen' | 'None';
  totalDiscountReceived?: number;
  rawTransactions?: SalesData[]; // Add raw transaction data for drill-down
}

export interface LapsedMemberData {
  memberId: string;
  customerName: string;
  customerEmail: string;
  lastMembershipEndDate: string;
  daysSinceLapsed: number;
  lastMembershipType: string;
  totalLifetimeValue: number;
  lastPurchaseAmount: number;
  rawTransactions?: SalesData[]; // Add raw transaction data for drill-down
}

export interface StackedMembershipDetail {
  membershipName: string;
  endDate: string;
  amountPaid: number;
  purchaseDate: string;
  category: string;
  discountAmount?: number;
}

export interface StackedMemberData {
  memberId: string;
  customerName: string;
  customerEmail: string;
  totalMemberships: number;
  totalAmountPaid: number;
  memberships: StackedMembershipDetail[];
}

export interface TransactionDetail {
  transactionId: string;
  memberId: string;
  customerName: string;
  customerEmail: string;
  paymentDate: string;
  paymentValue: number;
  product: string;
  category: string;
  isNew: boolean;
  isStacked: boolean;
  discountAmount: number;
  discountPercentage: number;
  mrpPreTax?: number;
  mrpPostTax?: number;
  discountType?: string;
  savings?: number; // MRP - Actual Paid
  location: string;
  membershipEndDate?: string;
}

export interface OutlierMonthAnalytics {
  // Overall metrics
  totalRevenue: number;
  newClientRevenue: number;
  existingClientRevenue: number;
  activeMembershipRevenue: number;
  
  // Detailed Revenue Split Metrics
  newCustomerMetrics: {
    revenue: number;
    unitsSold: number;
    transactions: number;
    uniqueMembers: number;
    atv: number; // Average Transaction Value
    discountedRevenue: number;
    nonDiscountedRevenue: number;
    discountedTransactions: number;
    nonDiscountedTransactions: number;
    totalDiscountAmount: number;
    avgDiscountPercentage: number;
  };
  repeatCustomerMetrics: {
    revenue: number;
    unitsSold: number;
    transactions: number;
    uniqueMembers: number;
    atv: number;
    discountedRevenue: number;
    nonDiscountedRevenue: number;
    discountedTransactions: number;
    nonDiscountedTransactions: number;
    totalDiscountAmount: number;
    avgDiscountPercentage: number;
  };
  
  // Client counts
  totalClients: number;
  newClients: number;
  existingClients: number;
  clientsWithActiveMembers: number;
  clientsWithMultipleMemberships: number;
  
  // Membership behavior
  renewals: number;
  upgrades: number;
  downgrades: number;
  stackingMembers: number;
  stackedMembersDetails: StackedMemberData[]; // Detailed list of members with stacked memberships
  
  // Daily breakdown
  dailyAnalytics: DailyAnalytics[];
  
  // Membership breakdown
  membershipAnalytics: MembershipAnalytics[];
  
  // Spenders - bifurcated by new/repeat
  topNewSpenders: SpenderData[];
  topRepeatSpenders: SpenderData[];
  bottomNewSpenders: SpenderData[];
  bottomRepeatSpenders: SpenderData[];
  topSpenders: SpenderData[]; // Keep for compatibility
  bottomSpenders: SpenderData[]; // Keep for compatibility
  
  // Lapsed members
  lapsedMembers: LapsedMemberData[];
  
  // Discount analytics
  totalDiscountGiven: number;
  transactionsWithDiscount: number;
  avgDiscountPercentage: number;
  
  // Visit patterns (from checkins)
  totalVisits: number;
  avgVisitsPerClient: number;
  visitToRevenueRatio: number;
  
  // Transaction-level details for drill-down
  newTransactions: TransactionDetail[];
  repeatTransactions: TransactionDetail[];
  allTransactions: SalesData[]; // Raw sales data for the month
}

export const useOutlierMonthAnalytics = (
  salesData: SalesData[],
  checkinsData: CheckinData[],
  newClientData: NewClientData[],
  month: 'april' | 'august',
  location?: string
) => {
  return useMemo(() => {
    // Determine month parameters
    const monthConfig = month === 'april' 
      ? { year: 2025, monthIndex: 3, monthName: 'April' }
      : { year: 2025, monthIndex: 7, monthName: 'August' };
    
    // Define today for membership status calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Filter sales data for the specific month and location
    const monthSalesData = salesData.filter(item => {
      if (!item.paymentDate) return false;
      const date = new Date(item.paymentDate);
      const matchesMonth = date.getFullYear() === monthConfig.year && date.getMonth() === monthConfig.monthIndex;
      const matchesLocation = !location || item.calculatedLocation === location;
      return matchesMonth && matchesLocation && item.paymentStatus === 'succeeded';
    });

    // Build a global customer first purchase map (across ALL data)
    const customerFirstPurchaseMap = new Map<string, Date>();
    salesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId || !item.paymentDate || item.paymentStatus !== 'succeeded') return;
      
      const purchaseDate = new Date(item.paymentDate);
      const existing = customerFirstPurchaseMap.get(customerId);
      if (!existing || purchaseDate < existing) {
        customerFirstPurchaseMap.set(customerId, purchaseDate);
      }
    });

    // Determine if a customer is new based on FIRST TRANSACTION EVER
    // A customer is considered "new" if their first-ever purchase is in this month
    // ALL purchases by that customer in this month are then attributed to "new"
    const isNewCustomer = (customerId: string, purchaseDate: Date): boolean => {
      const firstPurchase = customerFirstPurchaseMap.get(customerId);
      if (!firstPurchase) return true; // If no record, consider new
      
      // Check if their first purchase is in the same month and year as this purchase
      const firstPurchaseMonth = firstPurchase.getMonth();
      const firstPurchaseYear = firstPurchase.getFullYear();
      const currentMonth = purchaseDate.getMonth();
      const currentYear = purchaseDate.getFullYear();
      
      // If first purchase was in this month, consider all purchases in this month as "new"
      if (firstPurchaseMonth === monthConfig.monthIndex && firstPurchaseYear === monthConfig.year) {
        return true;
      }
      
      // Otherwise, check if this is the very first purchase
      return firstPurchase.getTime() === purchaseDate.getTime() ||
             (firstPurchase.toDateString() === purchaseDate.toDateString());
    };

    // Check if membership is stacked: Sec. Membership End Date is NOT BEFORE the purchase date
    // This means the member had an active membership when they purchased a new one
    const hasStackedMembership = (item: SalesData): boolean => {
      if (!item.secMembershipEndDate || !item.paymentDate) return false;
      
      const membershipEndDate = new Date(item.secMembershipEndDate);
      const purchaseDate = new Date(item.paymentDate);
      
      // Normalize dates to start of day for comparison
      membershipEndDate.setHours(0, 0, 0, 0);
      purchaseDate.setHours(0, 0, 0, 0);
      
      // Stacked if membership end date is NOT before purchase date (i.e., >= purchase date)
      return membershipEndDate >= purchaseDate;
    };

    // Build customer purchase history in this month
    const customerPurchases = new Map<string, SalesData[]>();
    monthSalesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId) return;
      
      if (!customerPurchases.has(customerId)) {
        customerPurchases.set(customerId, []);
      }
      customerPurchases.get(customerId)!.push(item);
    });

    // Calculate overall metrics
    const totalRevenue = monthSalesData.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
    
    let newClientRevenue = 0;
    let existingClientRevenue = 0;
    let activeMembershipRevenue = 0;
    const newClientIds = new Set<string>();
    const existingClientIds = new Set<string>();
    const clientsWithStackedMemberships = new Set<string>();
    
    monthSalesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId) return;
      
      const purchaseDate = new Date(item.paymentDate);
      const isNew = isNewCustomer(customerId, purchaseDate);
      
      if (isNew) {
        newClientRevenue += item.paymentValue || 0;
        newClientIds.add(customerId);
      } else {
        existingClientRevenue += item.paymentValue || 0;
        existingClientIds.add(customerId);
      }
      
      // Check if membership was stacked (purchased while having active membership)
      if (hasStackedMembership(item)) {
        activeMembershipRevenue += item.paymentValue || 0;
        clientsWithStackedMemberships.add(customerId);
      }
    });

    // Calculate detailed metrics for NEW customers (discounted vs non-discounted)
    const newCustomerMetrics = {
      revenue: 0,
      unitsSold: 0,
      transactions: 0,
      uniqueMembers: new Set<string>(),
      atv: 0,
      discountedRevenue: 0,
      nonDiscountedRevenue: 0,
      discountedTransactions: 0,
      nonDiscountedTransactions: 0,
      totalDiscountAmount: 0,
      totalDiscountPercentage: 0,
      discountCount: 0,
      avgDiscountPercentage: 0
    };

    // Calculate detailed metrics for REPEAT customers (discounted vs non-discounted)
    const repeatCustomerMetrics = {
      revenue: 0,
      unitsSold: 0,
      transactions: 0,
      uniqueMembers: new Set<string>(),
      atv: 0,
      discountedRevenue: 0,
      nonDiscountedRevenue: 0,
      discountedTransactions: 0,
      nonDiscountedTransactions: 0,
      totalDiscountAmount: 0,
      totalDiscountPercentage: 0,
      discountCount: 0,
      avgDiscountPercentage: 0
    };

    monthSalesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId) return;
      
      const purchaseDate = new Date(item.paymentDate);
      const isNew = isNewCustomer(customerId, purchaseDate);
      const hasDiscount = (item.discountAmount && item.discountAmount > 0) || 
                         (item.discountPercentage && item.discountPercentage > 0);
      
      const metrics = isNew ? newCustomerMetrics : repeatCustomerMetrics;
      
      metrics.revenue += item.paymentValue || 0;
      metrics.unitsSold += 1;
      metrics.transactions += 1;
      metrics.uniqueMembers.add(customerId);
      
      if (hasDiscount) {
        metrics.discountedRevenue += item.paymentValue || 0;
        metrics.discountedTransactions += 1;
        metrics.totalDiscountAmount += item.discountAmount || 0;
        if (item.discountPercentage && item.discountPercentage > 0) {
          metrics.totalDiscountPercentage += item.discountPercentage;
          metrics.discountCount += 1;
        }
      } else {
        metrics.nonDiscountedRevenue += item.paymentValue || 0;
        metrics.nonDiscountedTransactions += 1;
      }
    });

    // Calculate averages
    newCustomerMetrics.atv = newCustomerMetrics.transactions > 0 
      ? newCustomerMetrics.revenue / newCustomerMetrics.transactions 
      : 0;
    newCustomerMetrics.avgDiscountPercentage = newCustomerMetrics.discountCount > 0
      ? newCustomerMetrics.totalDiscountPercentage / newCustomerMetrics.discountCount
      : 0;
    
    repeatCustomerMetrics.atv = repeatCustomerMetrics.transactions > 0 
      ? repeatCustomerMetrics.revenue / repeatCustomerMetrics.transactions 
      : 0;
    repeatCustomerMetrics.avgDiscountPercentage = repeatCustomerMetrics.discountCount > 0
      ? repeatCustomerMetrics.totalDiscountPercentage / repeatCustomerMetrics.discountCount
      : 0;


    // Membership behavior analysis
    const customerMembershipHistory = new Map<string, {
      memberships: string[];
      prices: number[];
      dates: Date[];
    }>();

    // Excluded membership types for stacking calculation
    const excludedStackingTypes = ['studio single class', 'private class', 'money-credits'];
    
    monthSalesData
      .filter(item => ['subscription', 'pack'].includes(item.paymentCategory))
      .forEach(item => {
        const customerId = item.memberId || item.customerEmail;
        if (!customerId) return;
        
        if (!customerMembershipHistory.has(customerId)) {
          customerMembershipHistory.set(customerId, {
            memberships: [],
            prices: [],
            dates: []
          });
        }
        
        const history = customerMembershipHistory.get(customerId)!;
        history.memberships.push(item.cleanedProduct || item.paymentItem);
        history.prices.push(item.paymentValue || 0);
        history.dates.push(new Date(item.paymentDate));
      });

    let renewals = 0;
    let upgrades = 0;
    let downgrades = 0;
    
    customerMembershipHistory.forEach((history, customerId) => {
      // Sort by date
      const sorted = history.memberships.map((m, i) => ({
        membership: m,
        price: history.prices[i],
        date: history.dates[i]
      })).sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        
        // Same membership = renewal
        if (prev.membership === curr.membership) {
          renewals++;
        }
        // Higher price = upgrade
        else if (curr.price > prev.price) {
          upgrades++;
        }
        // Lower price = downgrade
        else if (curr.price < prev.price) {
          downgrades++;
        }
      }
    });

    // Stacking (multiple memberships per customer) - with detailed information
    const stackedMembersDetails: StackedMemberData[] = [];
    
    Array.from(customerMembershipHistory.entries()).forEach(([customerId, history]) => {
      if (history.memberships.length > 1) {
        // This customer has multiple memberships
        const customerTransactions = monthSalesData.filter(item => 
          (item.memberId || item.customerEmail) === customerId
        );
        
        // Filter out excluded membership types and categories
        const validMemberships = customerTransactions.filter(item => {
          const productName = (item.cleanedProduct || item.paymentItem || '').toLowerCase();
          const category = (item.cleanedCategory || '').toLowerCase();
          
          // Exclude by product name
          const excludedByName = excludedStackingTypes.some(excluded => productName.includes(excluded));
          
          // Exclude by category
          const excludedByCategory = ['product', 'event', 'money-credits'].includes(category);
          
          return !excludedByName && !excludedByCategory;
        });
        
        // Only count as stacking if they have 2+ valid memberships
        if (validMemberships.length > 1) {
          const memberships: StackedMembershipDetail[] = validMemberships.map(item => ({
            membershipName: item.cleanedProduct || item.paymentItem || 'Unknown',
            endDate: item.secMembershipEndDate || '',
            amountPaid: item.paymentValue || 0,
            purchaseDate: item.paymentDate || '',
            category: item.cleanedCategory || '',
            discountAmount: item.discountAmount || 0
          }));
          
          stackedMembersDetails.push({
            memberId: customerId,
            customerName: validMemberships[0]?.customerName || 'Unknown',
            customerEmail: validMemberships[0]?.customerEmail || '',
            totalMemberships: validMemberships.length,
            totalAmountPaid: validMemberships.reduce((sum, t) => sum + (t.paymentValue || 0), 0),
            memberships: memberships
          });
        }
      }
    });
    
    const stackingMembers = stackedMembersDetails.length;

    // Daily analytics
    const dailyMap = new Map<string, {
      revenue: number;
      newRevenue: number;
      existingRevenue: number;
      activeRevenue: number;
      transactions: number;
      newClients: Set<string>;
      existingClients: Set<string>;
      renewals: number;
      upgrades: number;
      downgrades: number;
      stacking: Set<string>;
    }>();

    monthSalesData.forEach(item => {
      const dateKey = new Date(item.paymentDate).toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          revenue: 0,
          newRevenue: 0,
          existingRevenue: 0,
          activeRevenue: 0,
          transactions: 0,
          newClients: new Set(),
          existingClients: new Set(),
          renewals: 0,
          upgrades: 0,
          downgrades: 0,
          stacking: new Set()
        });
      }
      
      const day = dailyMap.get(dateKey)!;
      day.revenue += item.paymentValue || 0;
      day.transactions++;
      
      const customerId = item.memberId || item.customerEmail;
      if (customerId) {
        const purchaseDate = new Date(item.paymentDate);
        if (isNewCustomer(customerId, purchaseDate)) {
          day.newRevenue += item.paymentValue || 0;
          day.newClients.add(customerId);
        } else {
          day.existingRevenue += item.paymentValue || 0;
          day.existingClients.add(customerId);
        }
        
        if (hasStackedMembership(item)) {
          day.activeRevenue += item.paymentValue || 0;
        }
        
        const purchases = customerPurchases.get(customerId) || [];
        if (purchases.length > 1) {
          day.stacking.add(customerId);
        }
      }
    });

    const dailyAnalytics: DailyAnalytics[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        newClientRevenue: data.newRevenue,
        existingClientRevenue: data.existingRevenue,
        activeMembershipRevenue: data.activeRevenue,
        transactions: data.transactions,
        newClients: data.newClients.size,
        existingClients: data.existingClients.size,
        renewals: data.renewals,
        upgrades: data.upgrades,
        downgrades: data.downgrades,
        stacking: data.stacking.size
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Membership analytics by product and category
    const membershipMap = new Map<string, {
      category: string;
      revenue: number;
      count: number;
      newClients: Set<string>;
      existingClients: Set<string>;
      renewals: number;
      upgrades: number;
      downgrades: number;
    }>();

    monthSalesData.forEach(item => {
      const key = item.cleanedProduct || item.paymentItem || 'Unknown';
      if (!membershipMap.has(key)) {
        membershipMap.set(key, {
          category: item.cleanedCategory || 'Other',
          revenue: 0,
          count: 0,
          newClients: new Set(),
          existingClients: new Set(),
          renewals: 0,
          upgrades: 0,
          downgrades: 0
        });
      }
      
      const membership = membershipMap.get(key)!;
      membership.revenue += item.paymentValue || 0;
      membership.count++;
      
      const customerId = item.memberId || item.customerEmail;
      if (customerId) {
        const purchaseDate = new Date(item.paymentDate);
        if (isNewCustomer(customerId, purchaseDate)) {
          membership.newClients.add(customerId);
        } else {
          membership.existingClients.add(customerId);
        }
      }
    });

    const membershipAnalytics: MembershipAnalytics[] = Array.from(membershipMap.entries())
      .map(([name, data]) => ({
        membershipName: name,
        cleanedCategory: data.category,
        revenue: data.revenue,
        count: data.count,
        avgPrice: data.count > 0 ? data.revenue / data.count : 0,
        newClients: data.newClients.size,
        existingClients: data.existingClients.size,
        renewals: data.renewals,
        upgrades: data.upgrades,
        downgrades: data.downgrades
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top and bottom spenders with raw transaction data
    const spenderMap = new Map<string, {
      name: string;
      email: string;
      total: number;
      transactions: number;
      firstDate: Date;
      lastDate: Date;
      isNew: boolean;
      rawTransactions: SalesData[];
      lastMembershipName?: string;
      lastMembershipEndDate?: Date;
      isFrozen?: boolean;
      totalDiscountReceived: number;
    }>();

    monthSalesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId) return;
      
      if (!spenderMap.has(customerId)) {
        const purchaseDate = new Date(item.paymentDate);
        spenderMap.set(customerId, {
          name: item.customerName,
          email: item.customerEmail,
          total: 0,
          transactions: 0,
          firstDate: purchaseDate,
          lastDate: purchaseDate,
          isNew: isNewCustomer(customerId, purchaseDate),
          rawTransactions: [],
          totalDiscountReceived: 0
        });
      }
      
      const spender = spenderMap.get(customerId)!;
      spender.total += item.paymentValue || 0;
      spender.transactions++;
      spender.rawTransactions.push(item); // Store raw transaction
      spender.totalDiscountReceived += item.discountAmount || 0;
      
      const itemDate = new Date(item.paymentDate);
      if (itemDate < spender.firstDate) spender.firstDate = itemDate;
      if (itemDate > spender.lastDate) spender.lastDate = itemDate;
      
      // Track latest membership info
      if (item.secMembershipEndDate) {
        const endDate = new Date(item.secMembershipEndDate);
        if (!spender.lastMembershipEndDate || endDate > spender.lastMembershipEndDate) {
          spender.lastMembershipName = item.cleanedProduct || item.paymentItem;
          spender.lastMembershipEndDate = endDate;
          spender.isFrozen = item.secMembershipIsFreezed === true || 
                            item.secMembershipIsFreezed === 'TRUE' ||
                            item.secMembershipIsFreezed === 'true';
        }
      }
    });

    const allSpenders: SpenderData[] = Array.from(spenderMap.entries())
      .map(([id, data]) => {
        // Determine membership status
        let membershipStatus: 'Active' | 'Expired' | 'Frozen' | 'None' = 'None';
        if (data.lastMembershipEndDate) {
          if (data.isFrozen) {
            membershipStatus = 'Frozen';
          } else if (data.lastMembershipEndDate >= today) {
            membershipStatus = 'Active';
          } else {
            membershipStatus = 'Expired';
          }
        }
        
        return {
          memberId: id,
          customerName: data.name,
          customerEmail: data.email,
          totalSpent: data.total,
          transactions: data.transactions,
          avgTransaction: data.transactions > 0 ? data.total / data.transactions : 0,
          firstPurchaseDate: data.firstDate.toISOString().split('T')[0],
          lastPurchaseDate: data.lastDate.toISOString().split('T')[0],
          isNew: data.isNew,
          lastMembershipName: data.lastMembershipName,
          lastMembershipEndDate: data.lastMembershipEndDate?.toISOString().split('T')[0],
          membershipStatus,
          totalDiscountReceived: data.totalDiscountReceived,
          rawTransactions: data.rawTransactions
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const topSpenders = allSpenders.slice(0, 20);
    const bottomSpenders = allSpenders.filter(s => s.totalSpent > 0).slice(-20).reverse();
    
    // Bifurcate spenders into new and repeat
    const newSpenders = allSpenders.filter(s => s.isNew);
    const repeatSpenders = allSpenders.filter(s => !s.isNew);
    
    const topNewSpenders = newSpenders.slice(0, 20);
    const topRepeatSpenders = repeatSpenders.slice(0, 20);
    const bottomNewSpenders = newSpenders.filter(s => s.totalSpent > 0).slice(-20).reverse();
    const bottomRepeatSpenders = repeatSpenders.filter(s => s.totalSpent > 0).slice(-20).reverse();


    // Lapsed members analysis - only show members whose membership has ACTUALLY expired (before today)
    const lapsedMembers: LapsedMemberData[] = [];
    
    const membershipEndMap = new Map<string, {
      endDate: Date;
      membershipType: string;
      lastAmount: number;
      isFrozen?: boolean; // Track if membership is frozen
    }>();

    // Build membership end dates from ALL sales data to get most recent membership
    salesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId || !item.secMembershipEndDate || item.paymentStatus !== 'succeeded') return;
      
      const endDate = new Date(item.secMembershipEndDate);
      endDate.setHours(0, 0, 0, 0); // Normalize to start of day
      const existing = membershipEndMap.get(customerId);
      
      // Keep track of the LATEST membership end date
      if (!existing || endDate > existing.endDate) {
        // Check if membership is frozen (treat TRUE/'TRUE' as frozen)
        const isFrozen = item.secMembershipIsFreezed === true || 
                        item.secMembershipIsFreezed === 'TRUE' ||
                        item.secMembershipIsFreezed === 'true';
        
        membershipEndMap.set(customerId, {
          endDate,
          membershipType: item.cleanedProduct || item.paymentItem,
          lastAmount: item.paymentValue || 0,
          isFrozen // Track freeze status
        });
      }
    });

    // Find lapsed members - membership end date is BEFORE today (truly expired)
    // BUT exclude frozen memberships (they are considered active)
    membershipEndMap.forEach((data, customerId) => {
      // Skip if membership is frozen (considered active)
      if (data.isFrozen) return;
      
      // Only include if membership end date is in the past (before today)
      if (data.endDate < today) {
        const daysSince = Math.floor((today.getTime() - data.endDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate lifetime value from sales data and get all transactions
        const customerSales = salesData.filter(s => 
          (s.memberId || s.customerEmail) === customerId &&
          s.paymentStatus === 'succeeded'
        );
        const ltv = customerSales.reduce((sum, s) => sum + (s.paymentValue || 0), 0);
        
        const memberData = customerSales[0];
        if (memberData) {
          lapsedMembers.push({
            memberId: customerId,
            customerName: memberData.customerName,
            customerEmail: memberData.customerEmail,
            lastMembershipEndDate: data.endDate.toISOString().split('T')[0],
            daysSinceLapsed: daysSince,
            lastMembershipType: data.membershipType,
            totalLifetimeValue: ltv,
            lastPurchaseAmount: data.lastAmount,
            rawTransactions: customerSales // Include all transactions for drill-down
          });
        }
      }
    });

    // Sort lapsed members by LTV (highest first)
    lapsedMembers.sort((a, b) => b.totalLifetimeValue - a.totalLifetimeValue);

    // Discount analytics
    const discountData = monthSalesData.filter(item => (item.discountAmount || 0) > 0);
    const totalDiscountGiven = discountData.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const avgDiscountPercentage = discountData.length > 0
      ? discountData.reduce((sum, item) => sum + (item.discountPercentage || 0), 0) / discountData.length
      : 0;

    // Visit patterns from checkins
    const monthCheckins = checkinsData.filter(checkin => {
      if (!checkin.dateIST) return false;
      const date = new Date(checkin.dateIST);
      return date.getFullYear() === monthConfig.year && 
             date.getMonth() === monthConfig.monthIndex &&
             (!location || checkin.location === location) &&
             checkin.checkedIn;
    });

    const totalVisits = monthCheckins.length;
    const uniqueVisitors = new Set(monthCheckins.map(c => c.memberId || c.email)).size;
    const avgVisitsPerClient = uniqueVisitors > 0 ? totalVisits / uniqueVisitors : 0;
    const visitToRevenueRatio = totalRevenue > 0 ? totalVisits / (totalRevenue / 1000) : 0;

    // Build detailed transaction arrays for new vs repeat with full drill-down data
    const newTransactions: TransactionDetail[] = [];
    const repeatTransactions: TransactionDetail[] = [];
    
    monthSalesData.forEach(item => {
      const customerId = item.memberId || item.customerEmail;
      if (!customerId) return;
      
      const purchaseDate = new Date(item.paymentDate);
      const isNew = isNewCustomer(customerId, purchaseDate);
      const isStacked = hasStackedMembership(item);
      
      // Calculate savings if MRP exists
      const mrp = item.mrpPostTax || item.mrpPreTax || 0;
      const savings = mrp > 0 ? mrp - (item.paymentValue || 0) : 0;
      
      const transaction: TransactionDetail = {
        transactionId: item.saleItemId || item.transactionId || '',
        memberId: customerId,
        customerName: item.customerName || '',
        customerEmail: item.customerEmail || '',
        paymentDate: item.paymentDate || '',
        paymentValue: item.paymentValue || 0,
        product: item.cleanedProduct || item.paymentItem || '',
        category: item.cleanedCategory || '',
        isNew,
        isStacked,
        discountAmount: item.discountAmount || 0,
        discountPercentage: item.discountPercentage || 0,
        mrpPreTax: item.mrpPreTax,
        mrpPostTax: item.mrpPostTax,
        discountType: item.discountType,
        savings,
        location: item.calculatedLocation || '',
        membershipEndDate: item.secMembershipEndDate
      };
      
      if (isNew) {
        newTransactions.push(transaction);
      } else {
        repeatTransactions.push(transaction);
      }
    });

    return {
      totalRevenue,
      newClientRevenue,
      existingClientRevenue,
      activeMembershipRevenue,
      
      // Detailed metrics with discount bifurcation
      newCustomerMetrics: {
        revenue: newCustomerMetrics.revenue,
        unitsSold: newCustomerMetrics.unitsSold,
        transactions: newCustomerMetrics.transactions,
        uniqueMembers: newCustomerMetrics.uniqueMembers.size,
        atv: newCustomerMetrics.atv,
        discountedRevenue: newCustomerMetrics.discountedRevenue,
        nonDiscountedRevenue: newCustomerMetrics.nonDiscountedRevenue,
        discountedTransactions: newCustomerMetrics.discountedTransactions,
        nonDiscountedTransactions: newCustomerMetrics.nonDiscountedTransactions,
        totalDiscountAmount: newCustomerMetrics.totalDiscountAmount,
        avgDiscountPercentage: newCustomerMetrics.avgDiscountPercentage
      },
      repeatCustomerMetrics: {
        revenue: repeatCustomerMetrics.revenue,
        unitsSold: repeatCustomerMetrics.unitsSold,
        transactions: repeatCustomerMetrics.transactions,
        uniqueMembers: repeatCustomerMetrics.uniqueMembers.size,
        atv: repeatCustomerMetrics.atv,
        discountedRevenue: repeatCustomerMetrics.discountedRevenue,
        nonDiscountedRevenue: repeatCustomerMetrics.nonDiscountedRevenue,
        discountedTransactions: repeatCustomerMetrics.discountedTransactions,
        nonDiscountedTransactions: repeatCustomerMetrics.nonDiscountedTransactions,
        totalDiscountAmount: repeatCustomerMetrics.totalDiscountAmount,
        avgDiscountPercentage: repeatCustomerMetrics.avgDiscountPercentage
      },
      
      totalClients: newClientIds.size + existingClientIds.size,
      newClients: newClientIds.size,
      existingClients: existingClientIds.size,
      clientsWithActiveMembers: clientsWithStackedMemberships.size,
      clientsWithMultipleMemberships: stackedMembersDetails.length,
      renewals,
      upgrades,
      downgrades,
      stackingMembers,
      stackedMembersDetails,
      dailyAnalytics,
      membershipAnalytics,
      
      // Bifurcated spenders
      topNewSpenders,
      topRepeatSpenders,
      bottomNewSpenders,
      bottomRepeatSpenders,
      topSpenders, // Keep for compatibility
      bottomSpenders, // Keep for compatibility
      
      lapsedMembers: lapsedMembers.slice(0, 50), // Top 50 lapsed by LTV
      totalDiscountGiven,
      transactionsWithDiscount: discountData.length,
      avgDiscountPercentage,
      totalVisits,
      avgVisitsPerClient,
      visitToRevenueRatio,
      newTransactions,
      repeatTransactions,
      allTransactions: monthSalesData // Include all raw sales data
    } as OutlierMonthAnalytics;
  }, [salesData, checkinsData, newClientData, month, location]);
};
