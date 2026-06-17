import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface UltimateLoaderProps {
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
}

export const UltimateLoader: React.FC<UltimateLoaderProps> = ({ 
  onComplete,
  title = "PHYSIQUE 57",
  subtitle = "Analytics Hub"
}) => {
  const location = useLocation();
  const [imgFailed, setImgFailed] = useState(false);
  const [srcIndex, setSrcIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const logoSrcs = ['/physique57-logo.png', '/placeholder.svg'];

  // Enhanced progress simulation that completes exactly when page is ready
  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    let completed = false;
    
    const startProgress = () => {
      progressTimer = setInterval(() => {
        setProgress(prev => {
          if (completed) return 100;
          
          // Smooth progress that slows down near completion
          const increment = prev > 95 ? 0.2 : prev > 85 ? 0.8 : Math.max(1.2, (100 - prev) * 0.15);
          const newProgress = Math.min(99, prev + increment); // Stop at 99%
          return newProgress;
        });
      }, 60);
    };

    const completeLoading = () => {
      if (completed) return;
      completed = true;
      clearInterval(progressTimer);
      
      // Set to 100% and immediately complete
      setProgress(100);
      onComplete?.();
    };

    startProgress();

    // Complete after minimum 1.8 seconds for smooth UX
    const minTimer = setTimeout(completeLoading, 1800);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(minTimer);
    };
  }, [onComplete]);

  // Dynamic messages based on current route
  const getLoadingMessages = () => {
    const path = location.pathname.toLowerCase();
    
    if (path.includes('sales')) {
      return [
        'Analyzing revenue trends...',
        'Processing sales data...',
        'Calculating ATV metrics...',
        'Loading sales insights...'
      ];
    } else if (path.includes('discount')) {
      return [
        'Loading discount analytics...',
        'Analyzing promotion impact...',
        'Processing offer data...',
        'Calculating discount ROI...'
      ];
    } else if (path.includes('funnel') || path.includes('lead')) {
      return [
        'Mapping conversion funnel...',
        'Analyzing lead pipeline...',
        'Processing prospect data...',
        'Tracking lead conversions...'
      ];
    } else if (path.includes('retention')) {
      return [
        'Analyzing member retention...',
        'Processing loyalty metrics...',
        'Tracking engagement patterns...',
        'Calculating retention rates...'
      ];
    } else if (path.includes('attendance') || path.includes('class')) {
      return [
        'Loading class schedules...',
        'Analyzing attendance patterns...',
        'Processing class bookings...',
        'Tracking studio capacity...'
      ];
    } else if (path.includes('cancellation')) {
      return [
        'Analyzing late cancellations...',
        'Processing timing data...',
        'Identifying usage patterns...',
        'Calculating policy impact...'
      ];
    } else if (path.includes('payroll')) {
      return [
        'Loading payroll data...',
        'Calculating compensation...',
        'Processing instructor hours...',
        'Preparing payroll reports...'
      ];
    } else if (path.includes('expiration')) {
      return [
        'Tracking member expirations...',
        'Analyzing renewal patterns...',
        'Processing membership data...',
        'Identifying retention opportunities...'
      ];
    } else if (path.includes('executive') || path.includes('summary')) {
      return [
        'Preparing executive summary...',
        'Aggregating key metrics...',
        'Processing studio performance...',
        'Loading dashboard overview...'
      ];
    } else if (path.includes('patterns') || path.includes('trends')) {
      return [
        'Analyzing usage patterns...',
        'Processing trend data...',
        'Identifying insights...',
        'Loading trend analysis...'
      ];
    } else {
      return [
        'Loading analytics dashboard...',
        'Processing studio data...',
        'Preparing insights...',
        'Almost ready...'
      ];
    }
  };

  const loadingMessages = getLoadingMessages();

  useEffect(() => {
    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 800);

    return () => {
      clearInterval(messageInterval);
    };
  }, [loadingMessages.length]);

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
      
      <motion.div 
        className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%, #ffffff 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 8s ease infinite'
        }}
      >
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Single refined gradient blob */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: '35rem',
            height: '35rem',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(37,99,235,0.04) 40%, transparent 70%)'
          }}
          initial={{ x: '20%', y: '20%', scale: 0.8 }}
          animate={{
            x: ['20%', '80%', '20%'],
            y: ['20%', '70%', '20%'],
            scale: [0.8, 1.1, 0.8]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: '30rem',
            height: '30rem',
            background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, rgba(37,99,235,0.03) 40%, transparent 70%)'
          }}
          initial={{ x: '60%', y: '60%', scale: 1.0 }}
          animate={{
            x: ['60%', '30%', '60%'],
            y: ['60%', '30%', '60%'],
            scale: [1.0, 0.8, 1.0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />

        {/* Subtle floating dots */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-slate-300/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: Math.random() * 4 + 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Main content container */}
      <motion.div 
        className="relative z-10 flex flex-col items-center gap-8 px-8 py-12"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.23, 1, 0.32, 1],
          delay: 0.2
        }}
      >
        {/* Clean logo without background */}
        <motion.div 
          className="relative"
          animate={{ 
            y: [0, -8, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Logo content */}
          <AnimatePresence mode="wait">
            {!imgFailed ? (
              <motion.img
                key="logo"
                src={logoSrcs[srcIndex]}
                alt={title}
                className="w-24 h-24 object-contain drop-shadow-lg"
                onError={() => {
                  if (srcIndex < logoSrcs.length - 1) {
                    setSrcIndex(prev => prev + 1);
                  } else {
                    setImgFailed(true);
                  }
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <motion.div
                key="fallback"
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                P57
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Clean typography */}
        <motion.div 
          className="text-center space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.h1 
            className="text-4xl md:text-5xl font-black tracking-tight text-slate-800"
            animate={{
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {title}
          </motion.h1>
          
          <motion.h2 
            className="text-xl md:text-2xl font-light text-slate-600 tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {subtitle}
          </motion.h2>
        </motion.div>

        {/* Refined progress indicator */}
        <motion.div
          className="w-80 space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {/* Progress bar */}
          <div 
            className="relative h-2 rounded-full overflow-hidden bg-slate-100 border border-slate-200"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
              style={{
                boxShadow: '0 0 20px rgba(59,130,246,0.3)'
              }}
              initial={{ width: 0 }}
              animate={{ 
                width: `${progress}%`
              }}
              transition={{
                width: { duration: 0.3, ease: "easeOut" }
              }}
            />
            
            {/* Subtle shimmer effect */}
            <motion.div
              className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-transparent via-white/60 to-transparent"
              animate={{
                x: ['-64px', '384px']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Progress percentage */}
          <motion.div 
            className="text-center"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-slate-600 font-medium text-lg">
              {Math.round(progress)}%
            </span>
          </motion.div>
        </motion.div>

        {/* Clean loading messages */}
        <motion.div
          className="text-center min-h-[3rem] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              className="text-slate-500 text-lg font-medium tracking-wide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              {loadingMessages[currentMessageIndex]}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
      </motion.div>
    </>
  );
};

export default UltimateLoader;
