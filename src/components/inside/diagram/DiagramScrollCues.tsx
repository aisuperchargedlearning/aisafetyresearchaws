import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScrollMetrics } from '@/hooks/useScrollMetrics';
import { PROGRESS_BAR_HEIGHT } from './diagramLayout';

const HINT_SESSION_KEY = 'diagram-swipe-hint-shown';
const HINT_SECONDS = 4;
const QUIET = { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const };

function claimHintForSession() {
  try {
    if (sessionStorage.getItem(HINT_SESSION_KEY)) return false;
    sessionStorage.setItem(HINT_SESSION_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

function EdgeArrow({ side }: { side: 'left' | 'right' }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  const drift = side === 'left' ? -3 : 3;
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-2' : 'right-2'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={QUIET}
    >
      <motion.span
        className="flex h-8 w-8 items-center justify-center rounded-full border border-line/70 bg-field/75 text-ink-muted backdrop-blur-sm"
        animate={{ x: [0, drift, 0] }}
        transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
      >
        <Icon className="h-4 w-4" />
      </motion.span>
    </motion.div>
  );
}

export function DiagramEdgeCues({ metrics }: { metrics: ScrollMetrics }) {
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    if (metrics.scrollable && !metrics.interacted && claimHintForSession()) setHintVisible(true);
  }, [metrics.scrollable, metrics.interacted]);

  useEffect(() => {
    if (!hintVisible) return;
    const timer = window.setTimeout(() => setHintVisible(false), HINT_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [hintVisible]);

  useEffect(() => {
    if (metrics.interacted) setHintVisible(false);
  }, [metrics.interacted]);

  return (
    <>
      <AnimatePresence>
        {metrics.scrollable && !metrics.atStart && <EdgeArrow key="left" side="left" />}
        {metrics.scrollable && !metrics.atEnd && <EdgeArrow key="right" side="right" />}
      </AnimatePresence>
      <AnimatePresence>
        {hintVisible && (
          <motion.p
            key="hint"
            role="status"
            className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line/70 bg-field/85 px-4 py-2 text-xs text-ink backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={QUIET}
          >
            Swipe to see the full diagram
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
}

export function DiagramProgressBar({ metrics }: { metrics: ScrollMetrics }) {
  return (
    <div aria-hidden className="flex items-center px-5" style={{ height: PROGRESS_BAR_HEIGHT }}>
      <div className="relative h-px w-full bg-line/70">
        <motion.div
          className="absolute -top-px h-[3px] rounded-full bg-ink-muted/80"
          style={{ left: metrics.thumbLeft, width: metrics.thumbWidth }}
        />
      </div>
    </div>
  );
}
