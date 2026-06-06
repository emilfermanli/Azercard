import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';
import { dateToIso, isoToDate, todayIsoDate } from '@/utils/date-format';
import { MONTHS_AZ_FULL, WEEKDAYS_AZ_SHORT } from '@/utils/date-locale-az';

type PickerView = 'days' | 'months' | 'years';

type DatePickerPanelProps = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
};

const YEARS_PER_PAGE = 12;

function getMonthGrid(year: number, monthIndex: number): Array<string | null> {
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<string | null> = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(dateToIso(new Date(year, monthIndex, day)));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function isBefore(iso: string, bound?: string) {
  return bound ? iso < bound : false;
}

function isAfter(iso: string, bound?: string) {
  return bound ? iso > bound : false;
}

function isDayDisabled(iso: string, min?: string, max?: string) {
  return isBefore(iso, min) || isAfter(iso, max);
}

function isMonthDisabled(year: number, monthIndex: number, min?: string, max?: string) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const monthStart = dateToIso(new Date(year, monthIndex, 1));
  const monthEnd = dateToIso(new Date(year, monthIndex, lastDay));
  return (min ? monthEnd < min : false) || (max ? monthStart > max : false);
}

function isYearDisabled(year: number, min?: string, max?: string) {
  return (min ? `${year}-12-31` < min : false) || (max ? `${year}-01-01` > max : false);
}

function getInitialFocus(value: string) {
  const parsed = isoToDate(value) ?? isoToDate(todayIsoDate());
  if (!parsed) {
    const today = new Date();
    return { year: today.getFullYear(), monthIndex: today.getMonth() };
  }
  return { year: parsed.getFullYear(), monthIndex: parsed.getMonth() };
}

export function DatePickerPanel({ value, onChange, min, max }: DatePickerPanelProps) {
  const isDark = useShellTheme();
  const initialFocus = getInitialFocus(value);
  const [view, setView] = useState<PickerView>('days');
  const [year, setYear] = useState(initialFocus.year);
  const [monthIndex, setMonthIndex] = useState(initialFocus.monthIndex);
  const [yearPageStart, setYearPageStart] = useState(
    Math.floor(initialFocus.year / YEARS_PER_PAGE) * YEARS_PER_PAGE
  );

  const today = todayIsoDate();
  const dayCells = useMemo(() => getMonthGrid(year, monthIndex), [year, monthIndex]);
  const yearPageYears = useMemo(
    () => Array.from({ length: YEARS_PER_PAGE }, (_, index) => yearPageStart + index),
    [yearPageStart]
  );

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const navButtonClass = cn(
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition',
    isDark
      ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
      : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950'
  );
  const headerButtonClass = cn(
    'rounded-md px-2 py-1 text-sm font-semibold transition',
    isDark ? 'text-slate-100 hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-100'
  );
  const tileClass = (active: boolean, disabled = false) =>
    cn(
      'flex h-10 items-center justify-center rounded-lg text-sm font-medium transition',
      active
        ? 'bg-blue-600 text-white'
        : isDark
          ? 'text-slate-200 hover:bg-slate-800'
          : 'text-slate-700 hover:bg-slate-100',
      disabled && 'cursor-not-allowed opacity-35 hover:bg-transparent'
    );

  const shiftMonth = (delta: number) => {
    const next = new Date(year, monthIndex + delta, 1);
    setYear(next.getFullYear());
    setMonthIndex(next.getMonth());
  };

  const canShiftMonth = (delta: number) => {
    const probe = new Date(year, monthIndex + delta, 1);
    const probeYear = probe.getFullYear();
    const probeMonth = probe.getMonth();
    return !isMonthDisabled(probeYear, probeMonth, min, max);
  };

  const handleDaySelect = (iso: string) => {
    if (isDayDisabled(iso, min, max)) return;
    onChange(iso);
  };

  const handleMonthSelect = (nextMonthIndex: number) => {
    if (isMonthDisabled(year, nextMonthIndex, min, max)) return;
    setMonthIndex(nextMonthIndex);
    setView('days');
  };

  const handleYearSelect = (nextYear: number) => {
    if (isYearDisabled(nextYear, min, max)) return;
    setYear(nextYear);
    setView('months');
  };

  const yearPageEnd = yearPageStart + YEARS_PER_PAGE - 1;
  const minYear = min ? Number(min.slice(0, 4)) : 1900;
  const maxYear = max ? Number(max.slice(0, 4)) : 2100;
  const canGoPrevYears = yearPageStart > minYear;
  const canGoNextYears = yearPageStart + YEARS_PER_PAGE <= maxYear;
  const canShiftYear = (delta: number) => !isYearDisabled(year + delta, min, max);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-2">
        {view === 'days' && (
          <>
            <button
              type="button"
              className={cn(navButtonClass, !canShiftMonth(-1) && 'cursor-not-allowed opacity-40')}
              disabled={!canShiftMonth(-1)}
              onClick={() => shiftMonth(-1)}
              aria-label="Əvvəlki ay"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
              <button
                type="button"
                className={headerButtonClass}
                onClick={() => setView('months')}
              >
                {MONTHS_AZ_FULL[monthIndex]}
              </button>
              <button
                type="button"
                className={headerButtonClass}
                onClick={() => {
                  setYearPageStart(Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE);
                  setView('years');
                }}
              >
                {year}
              </button>
            </div>
            <button
              type="button"
              className={cn(navButtonClass, !canShiftMonth(1) && 'cursor-not-allowed opacity-40')}
              disabled={!canShiftMonth(1)}
              onClick={() => shiftMonth(1)}
              aria-label="Növbəti ay"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {view === 'months' && (
          <>
            <button
              type="button"
              className={cn(navButtonClass, !canShiftYear(-1) && 'cursor-not-allowed opacity-40')}
              disabled={!canShiftYear(-1)}
              onClick={() => setYear((current) => current - 1)}
              aria-label="Əvvəlki il"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn('flex-1 text-center text-sm font-semibold', headerButtonClass)}
              onClick={() => {
                setYearPageStart(Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE);
                setView('years');
              }}
            >
              {year}
            </button>
            <button
              type="button"
              className={cn(navButtonClass, !canShiftYear(1) && 'cursor-not-allowed opacity-40')}
              disabled={!canShiftYear(1)}
              onClick={() => setYear((current) => current + 1)}
              aria-label="Növbəti il"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {view === 'years' && (
          <>
            <button
              type="button"
              className={cn(navButtonClass, !canGoPrevYears && 'cursor-not-allowed opacity-40')}
              disabled={!canGoPrevYears}
              onClick={() => setYearPageStart((current) => current - YEARS_PER_PAGE)}
              aria-label="Əvvəlki illər"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className={cn('flex-1 text-center text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>
              {yearPageStart} – {yearPageEnd}
            </p>
            <button
              type="button"
              className={cn(navButtonClass, !canGoNextYears && 'cursor-not-allowed opacity-40')}
              disabled={!canGoNextYears}
              onClick={() => setYearPageStart((current) => current + YEARS_PER_PAGE)}
              aria-label="Növbəti illər"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="min-h-[16.5rem]">
        {view === 'days' && (
          <>
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS_AZ_SHORT.map((weekday) => (
                <div key={weekday} className={cn('py-1 text-center text-[11px] font-semibold', muted)}>
                  {weekday}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {dayCells.map((isoDate, index) => {
                if (!isoDate) {
                  return <div key={`empty-${index}`} aria-hidden />;
                }

                const day = Number(isoDate.slice(8, 10));
                const isSelected = value === isoDate;
                const isToday = isoDate === today;
                const disabled = isDayDisabled(isoDate, min, max);

                return (
                  <button
                    key={isoDate}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDaySelect(isoDate)}
                    className={cn(
                      tileClass(isSelected, disabled),
                      !isSelected && isToday && (isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-700')
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view === 'months' && (
          <div className="grid grid-cols-3 gap-2">
            {MONTHS_AZ_FULL.map((monthLabel, index) => {
              const disabled = isMonthDisabled(year, index, min, max);
              const isActive = monthIndex === index;

              return (
                <button
                  key={monthLabel}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleMonthSelect(index)}
                  className={tileClass(isActive, disabled)}
                >
                  {monthLabel}
                </button>
              );
            })}
          </div>
        )}

        {view === 'years' && (
          <div className="grid grid-cols-3 gap-2">
            {yearPageYears.map((itemYear) => {
              const disabled = isYearDisabled(itemYear, min, max);
              const isActive = year === itemYear;

              return (
                <button
                  key={itemYear}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleYearSelect(itemYear)}
                  className={tileClass(isActive, disabled)}
                >
                  {itemYear}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
