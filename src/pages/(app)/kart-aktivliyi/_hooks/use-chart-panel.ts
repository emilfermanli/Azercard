import { useCallback, useRef, useState } from 'react';

import {
  DEFAULT_CHART_WIDTH,
  MIN_CHART_WIDTH,
  MIN_TABLE_WIDTH,
  SPLITTER_SPACE,
  STACK_CHART_WIDTH,
} from '../_constants';

/**
 * Sağ panelin açıq/bağlı, stacked və enini idarə edir + cədvəl/qrafik
 * arasındakı splitter-in sürüklənmə məntiqi.
 */
export function useChartPanel() {
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(DEFAULT_CHART_WIDTH);
  const [chartStacked, setChartStacked] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  const openChart = useCallback(() => {
    setChartOpen(true);
    setChartStacked(false);
    setChartWidth(DEFAULT_CHART_WIDTH);
  }, []);

  const closeChart = useCallback(() => {
    setChartOpen(false);
    setChartStacked(false);
  }, []);

  const unstack = useCallback(() => {
    setChartStacked(false);
    setChartWidth(DEFAULT_CHART_WIDTH);
  }, []);

  const handleSplitterPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!splitContainerRef.current || !chartOpen) return;
      event.preventDefault();

      const container = splitContainerRef.current;
      const rect = container.getBoundingClientRect();
      const previousCursor = document.body.style.cursor;
      const previousSelect = document.body.style.userSelect;

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onPointerMove = (moveEvent: PointerEvent) => {
        const maxChartWidth = Math.max(
          MIN_CHART_WIDTH,
          rect.width - MIN_TABLE_WIDTH - SPLITTER_SPACE
        );
        const nextChartWidth = rect.right - moveEvent.clientX - SPLITTER_SPACE;

        if (nextChartWidth < STACK_CHART_WIDTH) {
          setChartStacked(true);
          setChartWidth(MIN_CHART_WIDTH);
          return;
        }

        setChartStacked(false);
        setChartWidth(Math.min(Math.max(nextChartWidth, MIN_CHART_WIDTH), maxChartWidth));
      };

      const onPointerUp = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousSelect;
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp, { once: true });
    },
    [chartOpen]
  );

  return {
    splitContainerRef,
    chartWidth,
    chartStacked,
    chartOpen,
    openChart,
    closeChart,
    unstack,
    handleSplitterPointerDown,
  };
}
