
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, Percent, Scale } from 'lucide-react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

const AnimatedNumber = ({ value, className = "" }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span className={className}>{displayValue}</span>;
};

const DashboardTitle = () => {
  const [colorIndex, setColorIndex] = useState(0);
  
  const colors = [
    'text-blue-400',
    'text-purple-400', 
    'text-pink-400',
    'text-indigo-400',
    'text-cyan-400',
    'text-emerald-400'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, 1500);
    
    return () => clearInterval(interval);
  }, [colors.length]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 15,
        delay: 0.5
      }
    }
  };

  return (
    <div className="flex items-center justify-center p-1 my-0 px-0 py-px">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center max-w-6xl mx-auto"
      >
        {/* Decorative border */}
        <motion.div
          variants={itemVariants}
          className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto mb-4"
        />

        {/* Main title container */}
        <div className="relative">
          {/* Background glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [0.8, 1.1, 0.8]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Title text */}
          <motion.h1
            variants={itemVariants}
            className="relative text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-2 tracking-tight"
          >
            <span className="inline-block">Physique{' '}</span>
            <motion.span
              className={`inline-block transition-colors duration-500 ${colors[colorIndex]}`}
              animate={{
                textShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.5)",
                  "0 0 30px rgba(147, 51, 234, 0.5)",
                  "0 0 20px rgba(236, 72, 153, 0.5)"
                ]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              57
            </motion.span>
            <span className="inline-block">, India</span>
          </motion.h1>
          
          {/* Border under title */}
          <motion.div
            variants={itemVariants}
            className="w-48 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto mt-2 mb-4"
          />

          {/* Subtitle */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <motion.div
              variants={iconVariants}
              className="p-2 rounded-full bg-muted border border-border"
            >
              <BarChart3 className="w-6 h-6 text-muted-foreground" />
            </motion.div>
            
            <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-muted-foreground">
              Advanced Analytics Dashboard
            </h2>
            
            <motion.div
              variants={iconVariants}
              className="p-2 rounded-full bg-muted border border-border"
            >
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </motion.div>
          </motion.div>
        </div>

        {/* Stats section */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
        >
          <motion.div
            className="p-6 rounded-lg bg-card border border-border"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              <AnimatedNumber value={Math.floor(Math.random() * 20) + 80} />%
            </div>
            <div className="text-sm text-muted-foreground">Conversions</div>
          </motion.div>

          <motion.div
            className="p-6 rounded-lg bg-card border border-border"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Percent className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              <AnimatedNumber value={Math.floor(Math.random() * 25) + 10} />%
            </div>
            <div className="text-sm text-muted-foreground">Discounts</div>
          </motion.div>

          <motion.div
            className="p-6 rounded-lg bg-card border border-border"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Scale className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              <AnimatedNumber value={Math.floor(Math.random() * 2000) + 7500} />
            </div>
            <div className="text-sm text-muted-foreground">Funnel Size</div>
          </motion.div>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center items-center gap-2 mt-8"
        >
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '1s' }} />
        </motion.div>

        {/* Bottom border */}
        <motion.div
          variants={itemVariants}
          className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto mt-6"
        />
      </motion.div>
    </div>
  );
};

export default DashboardTitle;
