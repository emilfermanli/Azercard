import { useEffect, useMemo, useState } from 'react';

import { useGetCardDashboardFiltersQuery } from '@/services/card-dashboard.service';
import type { TransactionDetailedArgs } from '@/types/card-transaction-detailed.type';
import { COLUMNS, FILTER_FIELDS, type TdFilterKey } from '../_constants';
import type { ColumnKey, SelectionChip, SelectOption } from '../_types';
import { labelText } from '../_utils';

type FilterValues = Record<TdFilterKey, string>;
type ColumnSelections = Record<ColumnKey, string>;

const EMPTY_FILTERS: FilterValues = FILTER_FIELDS.reduce(
  (acc, field) => ({ ...acc, [field.key]: '' }),
  {} as FilterValues
);

const EMPTY_SELECTIONS: ColumnSelections = COLUMNS.reduce(
  (acc, col) => ({ ...acc, [col.key]: '' }),
  {} as ColumnSelections
);

function toOptions(values: string[] = []): SelectOption[] {
  const seen = new Set<string>();
  const options: SelectOption[] = [];
  for (const value of values) {
    if (value && !seen.has(value)) {
      seen.add(value);
      options.push({ label: value, value });
    }
  }
  return options;
}

/**
 * TransactionDetailed filtrləri:
 *  - sütun seçimləri (bank/qurğu/issuing/target) — kliklə dərhal tətbiq, cross-filter;
 *  - əlavə parametr filtrləri + tarix aralığı — drawer (Təsdiq ilə).
 * Variant siyahıları CardDashboard/filters endpointindən təkrar istifadə olunur.
 */
export function useTdFilters() {
  const { data: filterOptions } = useGetCardDashboardFiltersQuery();

  const [selections, setSelections] = useState<ColumnSelections>(EMPTY_SELECTIONS);

  const [isOpen, setOpen] = useState(false);
  const [applied, setApplied] = useState<FilterValues>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<FilterValues>(EMPTY_FILTERS);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');

  // Sütun kliki — dəyəri toggle edir (təkrar klik = All).
  const toggleColumn = (key: ColumnKey, value: string) =>
    setSelections((current) => ({
      ...current,
      [key]: current[key] === value ? '' : value,
    }));

  const clearColumn = (key: ColumnKey) =>
    setSelections((current) => ({ ...current, [key]: '' }));

  const apiArgs = useMemo<TransactionDetailedArgs>(() => {
    const out: TransactionDetailedArgs = {};
    for (const col of COLUMNS) {
      if (selections[col.key]) (out[col.apiKey] as string) = selections[col.key];
    }
    for (const field of FILTER_FIELDS) {
      if (applied[field.key]) (out[field.apiKey] as string) = applied[field.key];
    }
    if (dateFrom) out.DateFrom = `${dateFrom}T00:00:00`;
    if (dateTo) out.DateTo = `${dateTo}T00:00:00`;
    return out;
  }, [selections, applied, dateFrom, dateTo]);

  const options = useMemo(() => {
    const out = {} as Record<TdFilterKey, SelectOption[]>;
    for (const field of FILTER_FIELDS) {
      out[field.key] = toOptions(filterOptions?.[field.optionsKey]);
    }
    return out;
  }, [filterOptions]);

  const selected = useMemo(() => {
    const out = {} as Record<TdFilterKey, SelectOption | null>;
    for (const field of FILTER_FIELDS) {
      out[field.key] =
        options[field.key].find((o) => o.value === draft[field.key]) ?? null;
    }
    return out;
  }, [options, draft]);

  const chips = useMemo<SelectionChip[]>(
    () =>
      COLUMNS.filter((col) => selections[col.key]).map((col) => ({
        key: col.key,
        columnTitle: col.title,
        label: labelText(selections[col.key]),
      })),
    [selections]
  );

  const setDraftField = (key: TdFilterKey, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const anyDrawerApplied =
    FILTER_FIELDS.some((field) => applied[field.key]) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);
  const anyDrawerDraft =
    FILTER_FIELDS.some((field) => draft[field.key]) ||
    Boolean(draftDateFrom) ||
    Boolean(draftDateTo);
  const hasActiveFilters = anyDrawerApplied;
  const canReset = anyDrawerApplied || anyDrawerDraft;

  useEffect(() => {
    if (isOpen) {
      setDraft(applied);
      setDraftDateFrom(dateFrom);
      setDraftDateTo(dateTo);
    }
  }, [isOpen, applied, dateFrom, dateTo]);

  const apply = () => {
    setApplied(draft);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setOpen(false);
  };

  const reset = () => {
    setApplied(EMPTY_FILTERS);
    setDraft(EMPTY_FILTERS);
    setDateFrom('');
    setDateTo('');
    setDraftDateFrom('');
    setDraftDateTo('');
    setOpen(false);
  };

  return {
    apiArgs,
    selections,
    toggleColumn,
    clearColumn,
    chips,
    // drawer
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
  };
}

export type TdFiltersController = ReturnType<typeof useTdFilters>;
