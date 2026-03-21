import { useRef, useState, useEffect, useCallback, type RefObject } from 'react';

const THRESHOLD = 80;
const MAX_PULL = 120;

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pulling = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);

  const doRefresh = useCallback(async () => {
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setPullDistance(40);
    await onRefresh();
    isRefreshingRef.current = false;
    setIsRefreshing(false);
    setPullDistance(0);
  }, [onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
      pulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || isRefreshingRef.current) return;
      currentY.current = e.touches[0].clientY;
      const delta = currentY.current - startY.current;

      if (delta > 0) {
        // Prevent Chrome's native pull-to-refresh
        e.preventDefault();
        // Rubber-band effect: diminishing returns past threshold
        const dist = delta < THRESHOLD
          ? delta * 0.5
          : THRESHOLD * 0.5 + (delta - THRESHOLD) * 0.15;
        setPullDistance(Math.min(dist, MAX_PULL));
      } else {
        pulling.current = false;
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      const delta = currentY.current - startY.current;
      const effectiveDist = delta * 0.5;

      if (effectiveDist >= THRESHOLD) {
        doRefresh();
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [doRefresh]);

  return {
    containerRef: containerRef as RefObject<HTMLDivElement>,
    pullDistance,
    isRefreshing,
  };
}
