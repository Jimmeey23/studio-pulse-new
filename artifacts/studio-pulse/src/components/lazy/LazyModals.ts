/**
 * Lazy-loaded modal components for code splitting and performance optimization
 * 
 * Import these instead of direct imports to reduce initial bundle size
 * 
 * Usage:
 * import { Suspense } from 'react';
 * import { LazyEnhancedSalesDrillDownModal } from '@/components/lazy/LazyModals';
 * import { LoadingSpinner } from '@/components/ui/loading-spinner';
 * 
 * <Suspense fallback={<LoadingSpinner />}>
 *   {showModal && <LazyEnhancedSalesDrillDownModal ... />}
 * </Suspense>
 */

import { lazy } from 'react';

// Sales modals - only load when opened
export const LazyEnhancedSalesDrillDownModal = lazy(() => 
  import('@/components/dashboard/EnhancedSalesDrillDownModal')
);

export const LazySalesDrillDownModal = lazy(() => 
  import('@/components/dashboard/SalesDrillDownModal').then(m => ({ default: m.SalesDrillDownModal }))
);

export const LazyDiscountDrillDownModal = lazy(() => 
  import('@/components/dashboard/DiscountDrillDownModal').then(m => ({ default: m.DiscountDrillDownModal }))
);

// Client conversion modals
export const LazyClientConversionDrillDownModalV3 = lazy(() => 
  import('@/components/dashboard/ClientConversionRetentionDrillDownModal').then(m => ({ default: m.ClientConversionDrillDownModalV3 }))
);

export const LazyClientConversionDrillDownModal = lazy(() => 
  import('@/components/dashboard/ClientConversionDrillDownModal').then(m => ({ default: m.ClientConversionDrillDownModal }))
);

// Universal modals
export const LazyUniversalDrillDownModal = lazy(() => 
  import('@/components/dashboard/UniversalDrillDownModal').then(m => ({ default: m.UniversalDrillDownModal }))
);

export const LazyModernDrillDownModal = lazy(() => 
  import('@/components/dashboard/ModernDrillDownModal').then(m => ({ default: m.ModernDrillDownModal }))
);

export const LazyDrillDownModal = lazy(() => 
  import('@/components/dashboard/DrillDownModal').then(m => ({ default: m.DrillDownModal }))
);

export const LazyDrillDownAnalyticsModal = lazy(() => 
  import('@/components/dashboard/DrillDownAnalyticsModal').then(m => ({ default: m.DrillDownAnalyticsModal }))
);

// Trainer modals
export const LazyEnhancedTrainerDrillDownModal = lazy(() => 
  import('@/components/dashboard/EnhancedTrainerDrillDownModal').then(m => ({ default: m.EnhancedTrainerDrillDownModal }))
);

// Class and attendance modals
export const LazyClassAttendanceDrillDownModal = lazy(() => 
  import('@/components/dashboard/ClassAttendanceDrillDownModal').then(m => ({ default: m.ClassAttendanceDrillDownModal }))
);

export const LazyFormatDrillDownModal = lazy(() => 
  import('@/components/dashboard/FormatDrillDownModal').then(m => ({ default: m.FormatDrillDownModal }))
);

export const LazyPowerCycleBarreStrengthDrillDownModal = lazy(() => 
  import('@/components/dashboard/PowerCycleBarreStrengthDrillDownModal').then(m => ({ default: m.PowerCycleBarreStrengthDrillDownModal }))
);

// Other modals
export const LazyLateCancellationsDrillDownModal = lazy(() => 
  import('@/components/dashboard/LateCancellationsDrillDownModal').then(m => ({ default: m.LateCancellationsDrillDownModal }))
);

export const LazyFunnelDrillDownModal = lazy(() => 
  import('@/components/dashboard/FunnelDrillDownModal').then(m => ({ default: m.FunnelDrillDownModal }))
);

export const LazyMemberInsightsDrillDownModal = lazy(() =>
  import('@/components/dashboard/MemberInsightsDrillDownModal').then(m => ({ default: m.MemberInsightsDrillDownModal }))
);

// UI modals
export const LazyAdvancedNotesModal = lazy(() => 
  import('@/components/ui/AdvancedNotesModal').then(m => ({ default: m.AdvancedNotesModal }))
);

export const LazySourceDataModal = lazy(() => 
  import('@/components/ui/SourceDataModal').then(m => ({ default: m.SourceDataModal }))
);

/**
 * Usage example:
 * 
 * import { Suspense } from 'react';
 * import { EnhancedSalesDrillDownModal } from '@/components/lazy/LazyModals';
 * import { LoadingSpinner } from '@/components/ui/loading-spinner';
 * 
 * function MyComponent() {
 *   const [showModal, setShowModal] = useState(false);
 * 
 *   return (
 *     <Suspense fallback={<LoadingSpinner />}>
 *       {showModal && <EnhancedSalesDrillDownModal ... />}
 *     </Suspense>
 *   );
 * }
 */
