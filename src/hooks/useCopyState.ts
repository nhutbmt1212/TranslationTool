import { useState, useRef, useEffect, useCallback } from 'react';

export const useCopyState = () => {
  const [copyState, setCopyState] = useState({ source: false, target: false });
  const copyResetTimers = useRef<{ source?: number; target?: number }>({});

  const handleCopy = useCallback((text: string, panel?: 'source' | 'target') => {
    if (!text) return;
    navigator.clipboard.writeText(text);

    if (panel) {
      setCopyState((prev) => ({ ...prev, [panel]: true }));
      if (copyResetTimers.current[panel]) {
        window.clearTimeout(copyResetTimers.current[panel]);
      }
      copyResetTimers.current[panel] = window.setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [panel]: false }));
      }, 1200);
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (copyResetTimers.current.source) {
        window.clearTimeout(copyResetTimers.current.source);
      }
      if (copyResetTimers.current.target) {
        window.clearTimeout(copyResetTimers.current.target);
      }
    };
  }, []);

  return { copyState, handleCopy };
};
