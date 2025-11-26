// Seattle Solstice Motion System

export const kaevaTransition = {
  duration: 0.5,
  ease: [0.2, 0.8, 0.2, 1], // Snappy start, slow settle
};

export const kaevaEntranceVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const kaevaPressVariants = {
  tap: { scale: 0.98 },
};

export const kaevaStaggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export const kaevaStaggerChild = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};
