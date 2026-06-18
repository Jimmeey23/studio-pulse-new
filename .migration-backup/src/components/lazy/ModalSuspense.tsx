/**
 * Standardized Suspense wrapper for lazy-loaded modals
 * 
 * Provides consistent loading states across all modal components
 */

import { Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface ModalSuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Default loading spinner for modals
 */
const ModalLoader = () => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card shadow-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

/**
 * Suspense wrapper for lazy-loaded modals
 * 
 * Usage:
 * ```tsx
 * import { ModalSuspense } from '@/components/lazy/ModalSuspense';
 * import { LazyEnhancedSalesDrillDownModal } from '@/components/lazy/LazyModals';
 * 
 * function MyComponent() {
 *   const [showModal, setShowModal] = useState(false);
 * 
 *   return (
 *     <ModalSuspense>
 *       {showModal && (
 *         <LazyEnhancedSalesDrillDownModal
 *           isOpen={showModal}
 *           onClose={() => setShowModal(false)}
 *           data={data}
 *           type="metric"
 *         />
 *       )}
 *     </ModalSuspense>
 *   );
 * }
 * ```
 */
export const ModalSuspense: React.FC<ModalSuspenseProps> = ({ 
  children, 
  fallback = <ModalLoader /> 
}) => {
  return <Suspense fallback={fallback}>{children}</Suspense>;
};

/**
 * HOC to automatically wrap a lazy modal with Suspense
 * 
 * Usage:
 * ```tsx
 * import { withModalSuspense } from '@/components/lazy/ModalSuspense';
 * import { LazyEnhancedSalesDrillDownModal } from '@/components/lazy/LazyModals';
 * 
 * const SalesDrillDownModal = withModalSuspense(LazyEnhancedSalesDrillDownModal);
 * 
 * // Use normally - Suspense is automatic
 * <SalesDrillDownModal isOpen={true} onClose={handleClose} data={data} type="metric" />
 * ```
 */
export function withModalSuspense<P extends object>(
  Component: ComponentType<P>
): React.FC<P> {
  return function ModalWithSuspense(props: P) {
    return (
      <ModalSuspense>
        <Component {...props} />
      </ModalSuspense>
    );
  };
}
