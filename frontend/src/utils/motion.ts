/**
 * @module utils/motion
 * @description Centralized motion tokens and variants for editorial animations
 * @since 2025-12-11
 */

export const MOTION_EASING = [0.16, 1, 0.3, 1] as const;

export const MOTION_DURATION = {
  micro: 0.15,
  section: 0.5,
  route: 0.3,
} as const;

export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: MOTION_DURATION.section, ease: MOTION_EASING },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: MOTION_DURATION.section, ease: MOTION_EASING },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: MOTION_DURATION.section, ease: MOTION_EASING },
};

export const hoverLift = {
  whileHover: { y: -4, transition: { duration: MOTION_DURATION.micro, ease: MOTION_EASING } },
};

export const pressScale = {
  whileTap: { scale: 0.98, transition: { duration: MOTION_DURATION.micro, ease: MOTION_EASING } },
};

export const routeTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: MOTION_DURATION.route, ease: MOTION_EASING },
};
