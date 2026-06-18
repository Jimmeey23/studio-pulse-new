import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UniversalLoader } from '@/components/ui/UniversalLoader';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

export const GlobalLoader: React.FC = () => {
  const { isLoading, loadingMessage, progress, steps, currentStepId } = useGlobalLoading();
  const [visible, setVisible] = useState(false);

  // Smooth enter/exit visibility with a tiny delay on exit to show 100%
  useEffect(() => {
    let t: any;
    if (isLoading) {
      setVisible(true);
    } else {
      // allow last frame to reach 100% visually before fading out
      t = setTimeout(() => setVisible(false), 300);
    }
    return () => clearTimeout(t);
  }, [isLoading]);

  // Extract variant from loading message or default to 'default'
  const getVariantFromMessage = (message: string): 'sales' | 'discounts' | 'funnel' | 'retention' | 'attendance' | 'analytics' | 'cancellations' | 'payroll' | 'expirations' | 'default' => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) return 'sales';
    if (lowerMessage.includes('discount') || lowerMessage.includes('promotion')) return 'discounts';
    if (lowerMessage.includes('funnel') || lowerMessage.includes('lead')) return 'funnel';
    if (lowerMessage.includes('retention') || lowerMessage.includes('conversion')) return 'retention';
    if (lowerMessage.includes('attendance') || lowerMessage.includes('class')) return 'attendance';
    if (lowerMessage.includes('cancellation')) return 'cancellations';
    if (lowerMessage.includes('payroll')) return 'payroll';
    if (lowerMessage.includes('expiration')) return 'expirations';
    if (lowerMessage.includes('analytics') || lowerMessage.includes('performance')) return 'analytics';
    return 'default';
  };

  const variant = getVariantFromMessage(loadingMessage);
  const currentStep = currentStepId ? steps.find(s => s.id === currentStepId)?.name : undefined;

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
          }}
          transition={{ 
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <UniversalLoader 
            variant={variant}
            subtitle={loadingMessage}
            progress={progress}
            showSteps={steps.length > 0}
            currentStep={currentStep}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
