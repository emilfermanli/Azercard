import { useState } from 'react';
import { ArrowLeftRight, Columns3, Rows3 } from 'lucide-react';

import type { CardDimension } from '@/types/cards.type';
import { DIMENSION_TABS } from '../_constants';
import { mutedText, subtlePanelClass } from '../_utils';

type MatrixDimensionToolbarProps = {
  xDimension: CardDimension;
  yDimension: CardDimension;
  onXChange: (dimension: CardDimension) => void;
  onYChange: (dimension: CardDimension) => void;
  onSwap: () => void;
  isDark: boolean;
};

type DimensionPickerProps = {
  label: string;
  axisIcon: React.ReactNode;
  active: CardDimension;
  excluded: CardDimension;
  excludedHint: string;
  onPick: (dimension: CardDimension) => void;
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
  const muted = mutedText(isDark);

  const selectClass = [
    'h-10 w-full rounded-lg border px-3 text-sm font-semibold outline-none ring-blue-500/40 transition focus:ring-2 sm:hidden',
    isDark
      ? 'border-slate-700 bg-slate-950 text-slate-100'
      : 'border-slate-200 bg-white text-slate-900',
  ].join(' ');

  return (
    <div className="min-w-0 flex-1">
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
        onChange={(event) => onPick(event.target.value as CardDimension)}
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
        role="tablist"
        aria-label={label}
        className="hidden flex-wrap gap-1 rounded-lg border border-blue-500/30 p-1 sm:flex"
      >
        {DIMENSION_TABS.map((tab) => {
          const isActive = tab.value === active;
          const isExcluded = tab.value === excluded;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={isExcluded}
              onClick={() => onPick(tab.value)}
              title={
                isExcluded
                  ? `Bu ölçü artıq ${excludedHint.toLowerCase()} istifadə olunur`
                  : tab.label
              }
              className={[
                'flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-100',
                isExcluded ? 'cursor-not-allowed opacity-35 hover:bg-transparent' : '',
              ].join(' ')}
            >
              <tab.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
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
      className={['mt-5 rounded-xl border p-3 sm:p-4', subtlePanelClass(isDark)].join(
        ' '
      )}
    >
      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-start">
        <DimensionPicker
          label="Sətir (Y)"
          axisIcon={<Rows3 className="h-3.5 w-3.5" aria-hidden />}
          active={yDimension}
          excluded={xDimension}
          excludedHint="Sütunda"
          onPick={onYChange}
          isDark={isDark}
        />

        <div className="flex items-center justify-center lg:pt-7">
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
          label="Sütun (X)"
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
