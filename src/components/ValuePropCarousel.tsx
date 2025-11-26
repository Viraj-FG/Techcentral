import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ValuePropCarouselProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "Your Household,\nYour Command",
    subtitle: "Voice-powered inventory management that actually understands you",
    icon: (
      <svg width="80" height="80" viewBox="0 0 80 80" className="text-secondary">
        <motion.circle
          cx="40"
          cy="40"
          r="30"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <motion.path
          d="M 40 20 L 40 60 M 20 40 L 60 40"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </svg>
    ),
  },
  {
    title: "Never Waste\nAnother Grape",
    subtitle: "AI-powered safety alerts for your family, pets, and allergies",
    icon: (
      <svg width="80" height="80" viewBox="0 0 80 80" className="text-secondary">
        <motion.path
          d="M 40 15 L 48 35 L 70 35 L 52 48 L 60 68 L 40 55 L 20 68 L 28 48 L 10 35 L 32 35 Z"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
    ),
  },
  {
    title: "Scan.\nPlan.\nLive.",
    subtitle: "Point your camera at anything. Kaeva does the rest.",
    icon: (
      <svg width="80" height="80" viewBox="0 0 80 80" className="text-secondary">
        <motion.rect
          x="20"
          y="20"
          width="40"
          height="40"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          rx="4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <motion.circle
          cx="40"
          cy="40"
          r="8"
          fill="currentColor"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
        />
      </svg>
    ),
  },
];

const ValuePropCarousel = ({ onComplete }: ValuePropCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center px-6 pb-safe pt-safe">
      {/* Progress dots */}
      <div className="absolute top-12 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "w-8 bg-secondary"
                : "w-1.5 bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Carousel content */}
      <div className="relative w-full max-w-md h-[500px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center gap-8"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              {slides[currentSlide].icon}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl font-bold text-white whitespace-pre-line leading-tight"
            >
              {slides[currentSlide].title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-400 max-w-sm"
            >
              {slides[currentSlide].subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="absolute bottom-12 left-0 right-0 flex items-center justify-between px-6 max-w-md mx-auto">
        <button
          onClick={prevSlide}
          className={`p-3 rounded-full border-2 border-slate-700 transition-all ${
            currentSlide === 0
              ? "opacity-0 pointer-events-none"
              : "opacity-100 hover:border-secondary hover:text-secondary"
          }`}
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={nextSlide}
          className="px-8 py-4 bg-secondary rounded-full text-background font-bold hover:bg-secondary/90 transition-all min-h-[48px]"
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
        </button>

        <button
          onClick={onComplete}
          className="p-3 text-slate-500 hover:text-white transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default ValuePropCarousel;
