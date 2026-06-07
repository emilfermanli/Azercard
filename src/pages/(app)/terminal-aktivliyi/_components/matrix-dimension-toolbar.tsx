import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeftRight, Columns3, Rows3 } from 'lucide-react';

import type { DeviceDimension } from '@/types/devices.type';
import { DIMENSION_TABS } from '../_constants';
import { mutedText, subtlePanelClass } from '../_utils';

type MatrixDimensionToolbarProps = {
  xDimension: DeviceDimension;
  yDimension: DeviceDimension;
  onXChange: (dimension: DeviceDimension) => void;
  onYChange: (dimension: DeviceDimension) => void;
  onSwap: () => void;
  isDark: boolean;
};

type DimensionPickerProps = {
  label: string;
  axisIcon: React.ReactNode;
  active: DeviceDimension;
  excluded: DeviceDimension;
  excludedHint: string;
  onPick: (dimension: DeviceDimension) => void;
  isDark: boolean;
};

function DimensionPicker({
  label,
  axisIcon,
  active,
  excluded,
  excludedHint,
  onPick,
  isDark,
}: DimensionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const activeIndex = DIMENSION_TABS.findIndex((tab) => tab.value === active);
  const muted = mutedText(isDark);

  const updatePill = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const buttons = container.querySelectorAll<HTMLButtonElement>('[data-dimension-tab]');
    const activeButton = buttons[activeIndex];
    if (!activeButton) return;
    setPillStyle({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
    });
  }, [activeIndex]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updatePill();

    const observer = new ResizeObserver(updatePill);
    observer.observe(container);
    window.addEventListener('resize', updatePill);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePill);
    };
  }, [updatePill, active]);

  const selectClass = [
    'h-10 w-full rounded-lg border px-3 text-sm font-semibold outline-none ring-blue-500/40 transition focus:ring-2 sm:hidden',
    isDark
      ? 'border-slate-700 bg-slate-950 text-slate-100'
      : 'border-slate-200 bg-white text-slate-900',
  ].join(' ');

  return (
    <div className="@container min-w-0 flex-1">
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className={[
            'flex items-center gap-1 text-xs font-semibold uppercase tracking-wide',
            muted,
          ].join(' ')}
        >
          {axisIcon}
          {label}
        </span>
      </div>

      <select
        className={selectClass}
        value={active}
        onChange={(event) => onPick(event.target.value as DeviceDimension)}
        aria-label={label}
      >
        {DIMENSION_TABS.map((tab) => (
          <option key={tab.value} value={tab.value} disabled={tab.value === excluded}>
            {tab.label}
            {tab.value === excluded ? ` (${excludedHint})` : ''}
          </option>
        ))}
      </select>

      <div
        ref={containerRef}
        role="tablist"
        aria-label={label}
        className="relative hidden min-w-0 grid-cols-4 gap-1 rounded-lg border border-blue-500/30 p-1 sm:grid"
      >
        <div
          className="pointer-events-none absolute top-1 bottom-1 rounded-md bg-blue-600 shadow-sm transition-[left,width] duration-200 ease-out"
          style={{ left: pillStyle.left, width: pillStyle.width }}
          aria-hidden
        />
        {DIMENSION_TABS.map((tab) => {
          const isActive = tab.value === active;
          const isExcluded = tab.value === excluded;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              data-dimension-tab
              aria-selected={isActive}
              disabled={isExcluded}
              onClick={() => onPick(tab.value)}
              title={
                isExcluded
                  ? `Bu ölçü artıq ${excludedHint.toLowerCase()} istifadə olunur`
                  : tab.label
              }
              className={[
                'relative z-10 flex h-9 min-w-0 items-center justify-center gap-1 rounded-md px-1.5 text-xs font-semibold transition-colors',
                isActive ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-600',
                isExcluded
                  ? 'cursor-not-allowed opacity-35'
                  : !isActive && (isDark ? 'hover:text-white' : 'hover:text-slate-950'),
              ].join(' ')}
            >
              <tab.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden truncate @[11rem]:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MatrixDimensionToolbar({
  xDimension,
  yDimension,
  onXChange,
  onYChange,
  onSwap,
  isDark,
}: MatrixDimensionToolbarProps) {
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwap = () => {
    setIsSwapping(true);
    onSwap();
    window.setTimeout(() => setIsSwapping(false), 300);
  };

  const swapButtonClass = [
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition duration-300',
    isSwapping ? 'rotate-180' : '',
    isDark
      ? 'border-blue-500/40 bg-slate-800/80 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200'
      : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50',
  ].join(' ');

  return (
    <div
      className={[
        '@container mt-5 rounded-xl border p-3 sm:p-4',
        subtlePanelClass(isDark),
      ].join(' ')}
    >
      <div className="flex flex-col items-stretch gap-4 @[42rem]:flex-row @[42rem]:items-end">
        <DimensionPicker
          label="Sətir (X)"
          axisIcon={<Rows3 className="h-3.5 w-3.5" aria-hidden />}
          active={yDimension}
          excluded={xDimension}
          excludedHint="Sütunda"
          onPick={onYChange}
          isDark={isDark}
        />

        <div className="flex items-center justify-center lg:pb-0.5">
          <button
            type="button"
            onClick={handleSwap}
            className={swapButtonClass}
            aria-label="Sətir və sütun ölçülərini dəyiş"
            title="Sətir və sütun ölçülərini dəyiş"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
        </div>

        <DimensionPicker
          label="Sütun (Y)"
          axisIcon={<Columns3 className="h-3.5 w-3.5" aria-hidden />}
          active={xDimension}
          excluded={yDimension}
          excludedHint="Sətirdə"
          onPick={onXChange}
          isDark={isDark}
        />
      </div>
    </div>
  );
}
