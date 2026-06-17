import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UltimateLoader } from './UltimateLoader';

interface UniversalLoaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'sales' | 'discounts' | 'funnel' | 'retention' | 'attendance' | 'analytics' | 'cancellations' | 'payroll' | 'expirations' | 'default';
  onComplete?: () => void;
  progress?: number;
  showSteps?: boolean;
  currentStep?: string;
}

export const UniversalLoader: React.FC<UniversalLoaderProps> = ({
  title = "Physique 57 Analytics",
  subtitle,
  variant = 'default',
  onComplete,
}) => {
  const getVariantSubtitle = () => {
    if (subtitle) return subtitle;
    
    switch (variant) {
      case 'sales':
        return 'Loading Sales Analytics...';
      case 'discounts':
        return 'Loading Discount Analysis...';
      case 'funnel':
        return 'Loading Funnel & Lead Data...';
      case 'retention':
        return 'Loading Retention Metrics...';
      case 'attendance':
        return 'Loading Class Attendance...';
      case 'analytics':
        return 'Loading Analytics Dashboard...';
      case 'cancellations':
        return 'Loading Late Cancellations...';
      case 'payroll':
        return 'Loading Payroll Data...';
      case 'expirations':
        return 'Loading Expiration Analytics...';
      default:
        return 'Analytics Hub';
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ 
          opacity: 0,
        }}
        transition={{ 
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        <UltimateLoader
          title={title}
          subtitle={getVariantSubtitle()}
          onComplete={onComplete}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default UniversalLoader;
