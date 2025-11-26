import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { ROUTE_ORDER_EXPORT } from "@/hooks/useSwipeNavigation";

interface PageTransitionProps {
  children: ReactNode;
  swipeProgress?: number;
  swipeDirection?: 'left' | 'right' | null;
}

export const PageTransition = ({ 
  children, 
  swipeProgress = 0,
  swipeDirection = null 
}: PageTransitionProps) => {
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  useEffect(() => {
    const currentIndex = ROUTE_ORDER_EXPORT.indexOf(location.pathname);
    const prevIndex = ROUTE_ORDER_EXPORT.indexOf(prevPath);
    
    if (currentIndex !== -1 && prevIndex !== -1) {
      // Determine slide direction based on index change
      if (currentIndex > prevIndex || (currentIndex === 0 && prevIndex === ROUTE_ORDER_EXPORT.length - 1)) {
        setSlideDirection('left');
      } else {
        setSlideDirection('right');
      }
    }
    
    setPrevPath(location.pathname);
  }, [location.pathname, prevPath]);

  // Calculate transform based on swipe progress
  const getSwipeTransform = () => {
    if (swipeProgress > 0 && swipeDirection) {
      const translatePercent = swipeProgress * 100;
      return swipeDirection === 'right' ? translatePercent : -translatePercent;
    }
    return 0;
  };

  const variants = {
    enter: (direction: string) => ({
      x: direction === 'left' ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      x: direction === 'left' ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence initial={false} custom={slideDirection} mode="wait">
      <motion.div
        key={location.pathname}
        custom={slideDirection}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 }
        }}
        style={{
          transform: swipeProgress > 0.1 ? `translateX(${getSwipeTransform()}%)` : undefined,
          transition: swipeProgress > 0.1 ? 'none' : undefined,
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
