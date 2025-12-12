/**
 * @module components/CreationCorridor/CreationCorridorOverlay
 * @description Full-screen narrative overlay for the Creation Corridor funnel.
 * @since 2025-12-12
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@components/ui/Button';
import { MOTION_DURATION, MOTION_EASING } from '@utils/motion';
import { useCreationCorridor } from './useCreationCorridor';

/**
 * @component
 * @description Renders a full-screen overlay with narrative stages. When the corridor
 * is paused for authentication, it shows a single CTA to continue.
 *
 * @returns {JSX.Element | null} The overlay UI, or null when not visible.
 */
export default function CreationCorridorOverlay(): JSX.Element | null {
  const { state, stages, overlayVisible, goToAuth, exit } = useCreationCorridor();
  const shouldReduceMotion = useReducedMotion();

  if (!overlayVisible) return null;

  const stage = stages[state.stageIndex];
  if (!stage) return null;

  const progressPct = Math.max(0, Math.min(100, Math.round(((state.stageIndex + 1) / stages.length) * 100)));

  const corridorFadeDurationS = shouldReduceMotion ? 0.2 : 0.85;
  const corridorTransition = { duration: corridorFadeDurationS, ease: MOTION_EASING };

  const stageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: corridorTransition,
  };

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-surface px-6 py-10 text-ink dark:bg-surface-dark dark:text-ink-dark">
      <div className="w-full max-w-xl">
        <div className="grid">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={stage.key}
              initial={stageVariants.initial}
              animate={stageVariants.animate}
              exit={stageVariants.exit}
              transition={stageVariants.transition}
              className="col-start-1 row-start-1 space-y-6"
            >
            <div className="space-y-2">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-muted dark:text-muted-dark">
                Creation Corridor
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
                {stage.title}
              </h2>
              <p className="font-sans text-sm leading-relaxed text-muted dark:text-muted-dark">
                {stage.subtitle}
              </p>
            </div>

            {state.phase === 'AUTH_PAUSED' && stage.isAuthPause && (
              <div className="space-y-3 rounded-xl border border-muted/20 bg-surface-2 p-5 shadow-soft dark:border-muted-dark/20 dark:bg-surface-dark">
                <p className="font-sans text-sm text-ink dark:text-ink-dark">
                  Sign in to keep this draft attached to your account.
                </p>
                <Button
                  variant="pulse-gradient"
                  className="w-full bg-accent hover:opacity-90 dark:bg-accent-dark"
                  onClick={goToAuth}
                >
                  Sign in to continue
                </Button>
              </div>
            )}

            {state.phase === 'ERROR' && (
              <div className="space-y-3 rounded-xl border border-muted/20 bg-surface-2 p-5 shadow-soft dark:border-muted-dark/20 dark:bg-surface-dark">
                <p className="font-sans text-sm text-ink dark:text-ink-dark">
                  {state.errorMessage || 'Something interrupted the draft creation flow.'}
                </p>
                <Button variant="secondary" className="w-full" onClick={exit}>
                  Exit
                </Button>
              </div>
            )}

            {state.phase !== 'AUTH_PAUSED' && state.phase !== 'ERROR' && (
              <div className="space-y-3">
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted/20 dark:bg-muted-dark/20">
                  <div
                    className="h-full rounded-full bg-accent dark:bg-accent-dark"
                    style={{
                      width: `${progressPct}%`,
                      transition: shouldReduceMotion
                        ? 'none'
                        : `width ${MOTION_DURATION.section}s cubic-bezier(${MOTION_EASING.join(',')})`,
                    }}
                  />
                </div>
                <p className="font-sans text-xs text-muted dark:text-muted-dark">
                  Stay with it — we’re almost there.
                </p>
              </div>
            )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
