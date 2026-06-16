import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, RotateCcw, X } from 'lucide-react';
import Select, { type SingleValue, type StylesConfig } from 'react-select';

import { Button, DateInput } from '@/components';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { FILTER_FIELDS } from '../_constants';
import type { TdFiltersController } from '../_hooks/use-td-filters';
import type { SelectOption } from '../_types';
import { mutedText } from '../_utils';

export function FiltersDrawer({ filters }: { filters: TdFiltersController }) {
  const isDark = useShellTheme();
  const muted = mutedText(isDark);
  const {
    isOpen,
    setOpen,
    options,
    selected,
    setDraftField,
    draftDateFrom,
    draftDateTo,
    setDraftDateFrom,
    setDraftDateTo,
    hasActiveFilters,
    canReset,
    apply,
    reset,
  } = filters;

  const inputClass = [
    'h-10 w-full rounded-lg border px-3 text-sm outline-none ring-blue-500/40 transition focus:ring-2',
    isDark
      ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500'
      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400',
  ].join(' ');
  const outlineButtonClass = isDark
    ? 'border-slate-500 bg-slate-800/90 text-slate-100 hover:bg-slate-700 hover:text-white'
    : '';

  const selectStyles = useMemo<StylesConfig<SelectOption, false>>(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: 40,
        borderRadius: 8,
        borderColor: state.isFocused ? '#3b82f6' : isDark ? '#334155' : '#e2e8f0',
        backgroundColor: isDark ? '#020617' : '#ffffff',
        boxShadow: state.isFocused ? '0 0 0 2px rgb(59 130 246 / 0.4)' : 'none',
        ':hover': {
          borderColor: state.isFocused ? '#3b82f6' : isDark ? '#475569' : '#cbd5e1',
        },
      }),
      input: (base) => ({ ...base, color: isDark ? '#f8fafc' : '#0f172a' }),
      menu: (base) => ({
        ...base,
        zIndex: 80,
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        backgroundColor: isDark ? '#020617' : '#ffffff',
        boxShadow: isDark
          ? '0 18px 40px rgb(0 0 0 / 0.35)'
          : '0 18px 40px rgb(15 23 42 / 0.12)',
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? '#2563eb'
          : state.isFocused
            ? isDark
              ? '#1e293b'
              : '#eff6ff'
            : 'transparent',
        color: state.isSelected ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a',
      }),
      placeholder: (base) => ({ ...base, color: isDark ? '#94a3b8' : '#64748b' }),
      singleValue: (base) => ({ ...base, color: isDark ? '#f8fafc' : '#0f172a' }),
    }),
    [isDark]
  );

  return (
    <div
      aria-hidden={!isOpen}
      className="fixed inset-0 z-[110] h-dvh transition pointer-events-none"
    >
      <button
        aria-label="Filter panelini bağla"
        className={[
          'absolute inset-0 bg-slate-950/40 transition-opacity',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={() => setOpen(false)}
        type="button"
      />
      <aside
        aria-label="Filterlər"
        className={[
          'fixed bottom-0 right-0 top-0 flex h-dvh min-h-dvh w-full max-w-[420px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out pointer-events-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          isDark
            ? 'border-slate-800 bg-slate-950 text-slate-100'
            : 'border-slate-200 bg-white text-slate-950',
        ].join(' ')}
      >
        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Filter panelini bağla' : 'Filter panelini aç'}
          className={[
            'absolute right-full bottom-32 z-[90] -rotate-90 origin-center flex h-8 items-center gap-1.5 rounded-t-md border-x border-t px-3.5 text-[10px] font-bold uppercase tracking-wider shadow-2xl transition-all duration-300 pointer-events-auto',
            isOpen ? 'translate-x-[calc(50%-16px)]' : 'translate-x-[calc(50%-28px)]',
            isDark
              ? 'border-blue-500/30 bg-slate-950/95 text-blue-400 hover:text-blue-300 hover:bg-slate-900'
              : 'border-blue-200 bg-white/95 text-blue-600 hover:text-blue-700 hover:bg-blue-50',
          ].join(' ')}
          onClick={() => setOpen(!isOpen)}
          type="button"
        >
          {isOpen ? (
            <ChevronRight className="h-3.5 w-3.5 rotate-90 text-blue-500" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 rotate-90 text-blue-500" />
          )}
          <span>Filterlər</span>
          <Filter className="h-3 w-3 text-blue-500" />
          {hasActiveFilters && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"
              aria-hidden="true"
            />
          )}
        </button>

        <div
          className={[
            'flex items-start justify-between gap-3 border-b p-4',
            isDark ? 'border-slate-800' : 'border-slate-200',
          ].join(' ')}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
              <Filter className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">Filterlər</h2>
              <p className={['text-sm', muted].join(' ')}>
                Əlavə parametrlər və tarix aralığı üzrə süzün.
              </p>
            </div>
          </div>
          <button
            aria-label="Filter panelini bağla"
            className={[
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition',
              isDark
                ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            ].join(' ')}
            onClick={() => setOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-3">
            {FILTER_FIELDS.map((field) => (
              <label key={field.key} className="space-y-1.5 text-sm font-medium">
                <span className={muted}>{field.label}</span>
                <Select
                  inputId={`td-filter-${field.key}`}
                  isClearable
                  noOptionsMessage={() => 'Tapılmadı'}
                  onChange={(value: SingleValue<SelectOption>) =>
                    setDraftField(field.key, value?.value ?? '')
                  }
                  options={options[field.key]}
                  placeholder={field.placeholder}
                  styles={selectStyles}
                  value={selected[field.key]}
                />
              </label>
            ))}

            <label className="space-y-1.5 text-sm font-medium">
              <span className={muted}>Başlanğıc tarix</span>
              <DateInput
                className={inputClass}
                value={draftDateFrom}
                max={draftDateTo || undefined}
                onChange={setDraftDateFrom}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span className={muted}>Son tarix</span>
              <DateInput
                className={inputClass}
                value={draftDateTo}
                min={draftDateFrom || undefined}
                onChange={setDraftDateTo}
              />
            </label>
          </div>
        </div>

        <div
          className={[
            'flex items-center justify-between gap-3 border-t p-4',
            isDark ? 'border-slate-800' : 'border-slate-200',
          ].join(' ')}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={outlineButtonClass}
            disabled={!canReset}
            onClick={reset}
          >
            <RotateCcw className="h-4 w-4" />
            Təmizlə
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={apply}
          >
            Təsdiq et
          </Button>
        </div>
      </aside>
    </div>
  );
}
