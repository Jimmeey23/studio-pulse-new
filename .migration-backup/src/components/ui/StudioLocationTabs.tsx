import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MapPin, Play, Pause, Building2, Home, LocateFixed, Navigation } from 'lucide-react';
import { InfoPopover } from '@/components/ui/InfoSidebar';

interface StudioLocation {
  id: string;
  name: string;
  location: string;
  media: {
    type: 'image';
    sources: string[];
  };
}

interface StudioLocationTabsProps {
  locations?: StudioLocation[];
  activeLocation: string;
  onLocationChange: (locationId: string) => void;
  className?: string;
  autoPlayInterval?: number;
  showInfoPopover?: boolean;
  infoPopoverContext?: string;
}

const defaultLocations: StudioLocation[] = [
  {
    id: 'all',
    name: 'All Locations',
    location: 'Mumbai & Bangalore',
    media: {
      type: 'image',
      sources: [
        '/images/B1.jpg',
        '/images/BB1.webp',
        '/images/dra.jpeg',
        '/images/K1.webp',
        '/images/K2.webp',
        '/images/Lur.jpeg',
        '/images/007-10210-Physique-57-by-Atelier-Birjis-5.jpg',
        '/images/008-10210-Physique-57-by-Atelier-Birjis-6.png',
        '/images/003-10210-Physique-57-by-Atelier-Birjis-1.jpg',
        '/images/010-10210-Physique-57-by-Atelier-Birjis-2.jpg',
      ],
    },
  },
  {
    id: 'kwality',
    name: 'Kwality House',
    location: 'Kemps Corner, Mumbai',
    media: {
      type: 'image',
      sources: [
        '/images/K1.webp',
        '/images/K2.webp',
        '/images/B1.jpg',
      ],
    },
  },
  {
    id: 'supreme',
    name: 'Supreme HQ',
    location: 'Bandra, Mumbai',
    media: {
      type: 'image',
      sources: [
        '/images/B1.jpg',
        '/images/BB1.webp',
        '/images/dra.jpeg',
      ],
    },
  },
  {
    id: 'kenkere',
    name: 'Kenkere House',
    location: 'Bengaluru',
    media: {
      type: 'image',
      sources: [
        '/images/Lur.jpeg',
        '/images/007-10210-Physique-57-by-Atelier-Birjis-5.jpg',
        '/images/008-10210-Physique-57-by-Atelier-Birjis-6.png',
        '/images/003-10210-Physique-57-by-Atelier-Birjis-1.jpg',
        '/images/010-10210-Physique-57-by-Atelier-Birjis-2.jpg',
      ],
    },
  },
  {
    id: 'popup',
    name: 'Pop-up',
    location: 'Pop-up',
    media: {
      type: 'image',
      sources: [
        '/images/B1.jpg'
      ],
    },
  },
];

export const StudioLocationTabs: React.FC<StudioLocationTabsProps> = ({
  locations = defaultLocations,
  activeLocation,
  onLocationChange,
  className,
  autoPlayInterval = 3000,
  showInfoPopover = true,
  infoPopoverContext = "late-cancellations-overview",
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<Record<string, number>>({});
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [imageLoadingStatus, setImageLoadingStatus] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [autoCollapseTimer, setAutoCollapseTimer] = useState<NodeJS.Timeout | null>(null);
  const intervalRefs = useRef<Record<string, number>>({});

  // Shared animation state for synchronization
  const colorAnimation = {
    color: ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e"]
  };
  const colorTransition = {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut" as const
  };

  const activeLocationData = locations.find((loc) => loc.id === activeLocation) || locations[0];
  const displayLocation = activeLocationData;

  // Preload images for better performance
  const preloadImages = useCallback(async () => {
    const allImages = locations.flatMap(location => location.media.sources);
    const uniqueImages = [...new Set(allImages)];
    
    // Add preload links to HTML head for critical images (first image of each location)
    const criticalImages = locations.map(location => location.media.sources[0]);
    criticalImages.forEach(src => {
      if (!document.querySelector(`link[href="${src}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      }
    });
    
    const preloadPromises = uniqueImages.map(src => {
      return new Promise<string>((resolve, reject) => {
        if (preloadedImages.has(src)) {
          resolve(src);
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          setPreloadedImages(prev => new Set([...prev, src]));
          resolve(src);
        };
        img.onerror = () => reject(src);
        img.src = src;
      });
    });

    try {
      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }, [locations, preloadedImages]);

  // Preload images on component mount
  useEffect(() => {
    preloadImages();
  }, [preloadImages]);

  useEffect(() => {
    const initialIndices: Record<string, number> = {};
    const initialPlaying: Record<string, boolean> = {};
    const initialLoadingStatus: Record<string, 'loading' | 'loaded' | 'error'> = {};
    locations.forEach((loc) => {
      initialIndices[loc.id] = 0;
      initialPlaying[loc.id] = false;
      initialLoadingStatus[`${loc.id}-0`] = 'loading';
    });
    setCurrentMediaIndex(initialIndices);
    setIsPlaying(initialPlaying);
    setImageLoadingStatus(initialLoadingStatus);
  }, [locations]);

  const startSlideshow = useCallback((locationId: string) => {
    if (intervalRefs.current[locationId]) {
      clearInterval(intervalRefs.current[locationId]);
    }

    setIsPlaying((prev) => ({ ...prev, [locationId]: true }));

    intervalRefs.current[locationId] = setInterval(() => {
      setCurrentMediaIndex((prev) => {
        const location = locations.find((loc) => loc.id === locationId);
        if (!location) return prev;
        const nextIndex = (prev[locationId] + 1) % location.media.sources.length;
        return { ...prev, [locationId]: nextIndex };
      });
    }, autoPlayInterval);
  }, [locations, autoPlayInterval]);

  const stopSlideshow = useCallback((locationId: string) => {
    if (intervalRefs.current[locationId]) {
      clearInterval(intervalRefs.current[locationId]);
      delete intervalRefs.current[locationId];
    }
    setIsPlaying((prev) => ({ ...prev, [locationId]: false }));
  }, []);

  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, []);

  // Auto-play slideshow for active location
  useEffect(() => {
    // Stop all slideshows first
    locations.forEach(loc => {
      if (loc.id !== activeLocation) {
        stopSlideshow(loc.id);
        setCurrentMediaIndex(prev => ({ ...prev, [loc.id]: 0 }));
      }
    });
    
    // Start slideshow only for active location
    startSlideshow(activeLocation);
    
    return () => {
      // Cleanup on unmount
      stopSlideshow(activeLocation);
    };
  }, [activeLocation, startSlideshow, stopSlideshow, locations]);

  const handleMouseEnter = (locationId: string) => {
    setHoveredTab(locationId);
    // Only start slideshow on hover if it's not the active location (active auto-plays)
    if (locationId !== activeLocation) {
      startSlideshow(locationId);
    }
  };

  const handleMouseLeave = (locationId: string) => {
    setHoveredTab(null);
    // Only stop slideshow if it's not the active location (active continues playing)
    if (locationId !== activeLocation) {
      stopSlideshow(locationId);
      setCurrentMediaIndex((prev) => ({ ...prev, [locationId]: 0 }));
    }
  };

  const handleLocationSelect = (locationId: string) => {
    onLocationChange(locationId);
    // Collapse after selection
    setIsCollapsed(true);
  };

  const handleCollapsedClick = () => {
    setIsCollapsed(false);
    
    // Clear existing timer
    if (autoCollapseTimer) {
      clearTimeout(autoCollapseTimer);
      setAutoCollapseTimer(null);
    }
    
    // Set auto-collapse timer for 10 seconds
    const timer = setTimeout(() => {
      setIsCollapsed(true);
      setAutoCollapseTimer(null);
    }, 10000);
    
    setAutoCollapseTimer(timer);
  };

  // Cleanup timer on unmount and when timer changes
  useEffect(() => {
    return () => {
      if (autoCollapseTimer) {
        clearTimeout(autoCollapseTimer);
      }
    };
  }, [autoCollapseTimer]);

  const getLocationIcon = (id: string) => {
    if (id === 'all') return <Home className="w-4 h-4 text-white" />;
    return <Building2 className="w-4 h-4 text-white" />;
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Sophisticated Location Selection Section */}
      <motion.div
        className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-xl border border-slate-200/60 shadow-xl shadow-slate-900/10 backdrop-blur-sm overflow-hidden"
        initial={{ opacity: 0, y: 15 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          height: "auto"
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Elegant accent elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-60" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/5 rounded-full blur-3xl" />
        
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            // Collapsed View - Active Location with Styling and Info Icon
            <motion.div
              key="collapsed"
              className="relative z-10 p-4 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={handleCollapsedClick}
            >
              <div className="flex items-center gap-4 bg-black text-white rounded-lg p-3 hover:bg-gray-800 transition-colors duration-200 shadow-lg">
                {/* Color-Changing Location Pin Icon */}
                <motion.div
                  className="flex items-center justify-center"
                  animate={{ color: ["#ffffff", "#fef3c7", "#fed7aa", "#fbbf24", "#ffffff"] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <MapPin className="w-5 h-5 drop-shadow-lg" />
                </motion.div>

                {/* Selected Location Info with Info Icon */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="text-left">
                    <h3 className="text-sm font-bold tracking-wide">
                      {displayLocation.name.toUpperCase()}
                    </h3>
                    <p className="text-xs text-gray-300 font-medium">
                      {displayLocation.location.toUpperCase()}
                    </p>
                  </div>
                  
                  {/* Info Popover next to name */}
                  {showInfoPopover && (
                    <motion.div 
                      className="flex items-center justify-center"
                      animate={{ color: ["#ffffff", "#fef3c7", "#fed7aa", "#fbbf24", "#ffffff"] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      onClick={(e) => e.stopPropagation()} // Prevent location tab expansion when info icon is clicked
                    >
                      <div className="[&>*]:!bg-transparent [&>*]:!border-current [&>*]:!text-current">
                        <InfoPopover context={infoPopoverContext} locationId={activeLocation} />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Active indicator */}
                <div className="text-xs font-bold bg-white/10 px-2 py-1 rounded uppercase tracking-wide">
                  Active
                </div>
              </div>
            </motion.div>
          ) : (
            // Expanded View - Full Location Selection Interface
            <motion.div
              key="expanded"
              className="relative z-10 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Sophisticated Header */}
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="w-8 h-px bg-red-500" />
                  <h2 className="text-2xl font-light text-slate-800 tracking-wide">
                    Studio <span className="font-semibold text-red-600">Selection</span>
                  </h2>
                  <div className="w-8 h-px bg-red-500" />
                </div>
                <p className="text-sm text-slate-600 font-medium tracking-wide uppercase">
                  Choose Your Physique57 Location
                </p>
              </motion.div>

              {/* Sophisticated Location Tabs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {locations.map((location) => {
                  const isActive = activeLocation === location.id;
                  const isHovered = hoveredTab === location.id;
                  const currentIndex = currentMediaIndex[location.id] || 0;

                return (
                  <motion.div
                    key={location.id}
                    className="relative group cursor-pointer"
                    onMouseEnter={() => handleMouseEnter(location.id)}
                    onMouseLeave={() => handleMouseLeave(location.id)}
                    onClick={() => handleLocationSelect(location.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: isActive ? 1 : 0.90,
                      filter: isActive ? "grayscale(0%) brightness(1)" : "grayscale(100%) brightness(0.7)"
                    }}
                    transition={{ duration: 0.2, delay: locations.indexOf(location) * 0.02 }}
                    style={{ zIndex: isActive ? 10 : 1 }}
                        >
                    <motion.div
                      className={cn(
                        "group relative overflow-hidden rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm cursor-pointer",
                        isActive
                          ? "border-2 border-red-500 shadow-2xl shadow-red-500/25"
                          : "border border-slate-200/60 shadow-lg shadow-slate-900/10 hover:border-red-300 hover:shadow-xl hover:shadow-red-500/15"
                      )}
                      whileHover={{ 
                        y: -4, 
                        transition: { duration: 0.2, ease: "easeOut" } 
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Animated border for active tab */}
                      {isActive && (
                        <>
                          <motion.div
                            className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                          />
                          <motion.div
                            className="absolute bottom-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
                          />
                          <motion.div
                            className="absolute left-0 top-0 w-0.5 bg-gradient-to-b from-red-500 to-red-600"
                            initial={{ height: "0%" }}
                            animate={{ height: "100%" }}
                            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: 0.25 }}
                          />
                          <motion.div
                            className="absolute right-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 to-red-500"
                            initial={{ height: "0%" }}
                            animate={{ height: "100%" }}
                            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: 0.75 }}
                          />
                        </>
                      )}
                      {/* Animated border for active tab */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          style={{
                            background: 'linear-gradient(90deg, #dc2626, #b91c1c, #dc2626, #b91c1c)',
                            backgroundSize: '200% 100%',
                            padding: '0px',
                            zIndex: -1
                          }}
                          animate={{
                            backgroundPosition: ['0% 0%', '200% 0%']
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear'
                          }}
                        >
                          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-red-50/80 to-red-50/80" />
                        </motion.div>
                      )}
                      <div className="aspect-[16/9] relative overflow-hidden bg-slate-100">
                        {/* Loading spinner - only show if image is not preloaded */}
                        {imageLoadingStatus[`${location.id}-${currentIndex}`] === 'loading' && 
                         !preloadedImages.has(location.media.sources[currentIndex]) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                          </div>
                        )}
                        
                        <img
                          src={location.media.sources[currentIndex]}
                          alt={`${location.name} - Image ${currentIndex + 1}`}
                          className="w-full h-full object-cover transition-opacity duration-300"
                          style={{ 
                            imageRendering: 'crisp-edges',
                            opacity: imageLoadingStatus[`${location.id}-${currentIndex}`] === 'loaded' || preloadedImages.has(location.media.sources[currentIndex]) ? 1 : 0
                          }}
                          onError={(e) => {
                            console.error(`Failed to load image: ${location.media.sources[currentIndex]}`);
                            const imageKey = `${location.id}-${currentIndex}`;
                            setImageLoadingStatus(prev => ({ ...prev, [imageKey]: 'error' }));
                            
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            
                            // Create fallback gradient background
                            const parent = target.parentElement;
                            if (parent) {
                              parent.style.background = 'linear-gradient(135deg, #dc2626, #991b1b)';
                              
                              // Add location icon as fallback
                              if (!parent.querySelector('.fallback-content')) {
                                const fallbackDiv = document.createElement('div');
                                fallbackDiv.className = 'fallback-content absolute inset-0 flex items-center justify-center';
                                fallbackDiv.innerHTML = `
                                  <div class="text-center text-white">
                                    <div class="text-4xl mb-2">🏢</div>
                                    <div class="text-sm font-semibold">${location.name}</div>
                                  </div>
                                `;
                                parent.appendChild(fallbackDiv);
                              }
                            }
                          }}
                          onLoad={(e) => {
                            // Debug log removed for production
                            const imageKey = `${location.id}-${currentIndex}`;
                            setImageLoadingStatus(prev => ({ ...prev, [imageKey]: 'loaded' }));
                            
                            const target = e.currentTarget;
                            target.style.opacity = '1';
                            
                            // Remove any fallback content if it exists
                            const parent = target.parentElement;
                            const fallback = parent?.querySelector('.fallback-content');
                            if (fallback) {
                              fallback.remove();
                              parent.style.background = '';
                            }
                          }}
                          onLoadStart={() => {
                            const imageKey = `${location.id}-${currentIndex}`;
                            // Only set loading if image is not already preloaded
                            if (!preloadedImages.has(location.media.sources[currentIndex])) {
                              setImageLoadingStatus(prev => ({ ...prev, [imageKey]: 'loading' }));
                            }
                          }}
                        />

                        {isHovered && (
                          <motion.div
                            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                          >
                            {isPlaying[location.id] ? (
                              <Play className="w-4 h-4 text-red-600" />
                            ) : (
                              <Pause className="w-4 h-4 text-slate-600" />
                            )}
                          </motion.div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0">
                          <div className={cn(
                            "backdrop-blur-sm rounded-b-2xl",
                            isActive 
                              ? "shadow-lg" 
                              : "bg-black/70 shadow-md"
                          )}
                          style={{
                            backgroundColor: isActive ? '#e70c0cff' : undefined
                          }}>
                            <div className="flex items-center justify-between px-2 py-1">
                              <p
                                className="text-xs font-bold leading-tight truncate flex-1 text-white"
                                style={{ 
                                  textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                                }}
                              >
                                {location.name} • {location.location}
                              </p>
                              <div className="flex items-center ml-2 text-white">
                                {getLocationIcon(location.id)}
                              </div>
                            </div>
                          </div>

                        </div>

                        {isActive && (
                          <motion.div
                            className="absolute top-0 right-0 z-10"
                            layoutId="active-badge"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                          >
                            <div 
                              className="text-white px-3 py-1 rounded-bl-lg text-xs font-bold shadow-lg"
                              style={{ backgroundColor: '#ff0000' }}
                            >
                              ACTIVE
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10 blur-xl" />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                );
                })}
              </div>

              {/* Elegant Selected Location Info - Full Width Bottom Bar */}
              {activeLocation && (
                <motion.div
                  className="flex items-center justify-center gap-3 px-6 py-2 bg-slate-900 mt-6 rounded-b-xl -mx-6 -mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-1.5">
                    {/* Color-Changing Location Pin Icon */}
                    <motion.div
                      className="flex items-center justify-center"
                      animate={colorAnimation}
                      transition={colorTransition}
                    >
                      <MapPin className="w-5 h-5 drop-shadow-lg" />
                    </motion.div>

                    {/* Location Information - Single Line */}
                    <div className="flex items-center justify-center flex-1">
                      <span className="text-sm font-bold tracking-wide text-center">
                        <span className="text-white">{displayLocation.name.toUpperCase()}</span>
                        <span className="text-slate-400"> - {displayLocation.location.toUpperCase()}</span>
                      </span>
                    </div>

                    {/* Color-Changing Info Popover */}
                    {showInfoPopover && (
                      <motion.div 
                        className="flex items-center justify-center"
                        animate={colorAnimation}
                        transition={colorTransition}
                      >
                        <div className="[&>*]:!bg-transparent [&>*]:!border-current [&>*]:!text-current">
                          <InfoPopover context={infoPopoverContext} locationId={activeLocation} />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default StudioLocationTabs;