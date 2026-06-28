import { useEffect, useMemo, useState } from 'react';

import { useGetCardDashboardFiltersQuery } from '@/services/card-dashboard.service';
import type { SummaryTransactionArgs } from '@/types/summary-transaction.type';
import { FILTER_FIELDS, type SummaryFilterKey } from '../_constants';
import type { SelectOption } from '../_types';

type FilterValues = Record<SummaryFilterKey, string>;

const EMPTY_FILTERS: FilterValues = FILTER_FIELDS.reduce(
  (acc, field) => ({ ...acc, [field.key]: '' }),
  {} as FilterValues
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
 * SummaryTransaction filtrləri — drawer (Təsdiq ilə) + tarix aralığı.
 * Variant siyahıları CardDashboard/filters endpointindən təkrar istifadə olunur.
 */
export function useSummaryFilters() {
  const { data: filterOptions } = useGetCardDashboardFiltersQuery();

  const [isOpen, setOpen] = useState(false);
  const [applied, setApplied] = useState<FilterValues>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<FilterValues>(EMPTY_FILTERS);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');

  const apiArgs = useMemo<SummaryTransactionArgs>(() => {
    const out: SummaryTransactionArgs = {};
    for (const field of FILTER_FIELDS) {
      if (applied[field.key]) (out[field.apiKey] as string) = applied[field.key];
    }
    if (dateFrom) out.DateFrom = `${dateFrom}T00:00:00`;
    if (dateTo) out.DateTo = `${dateTo}T00:00:00`;
    return out;
  }, [applied, dateFrom, dateTo]);

  const options = useMemo(() => {
    const out = {} as Record<SummaryFilterKey, SelectOption[]>;
    for (const field of FILTER_FIELDS) {
      out[field.key] = field.staticOptions
        ? field.staticOptions
        : toOptions(filterOptions?.[field.optionsKey!]);
    }
    return out;
  }, [filterOptions]);

  const selected = useMemo(() => {
    const out = {} as Record<SummaryFilterKey, SelectOption | null>;
    for (const field of FILTER_FIELDS) {
      out[field.key] =
        options[field.key].find((o) => o.value === draft[field.key]) ?? null;
    }
    return out;
  }, [options, draft]);

  const setDraftField = (key: SummaryFilterKey, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const anyApplied =
    FILTER_FIELDS.some((field) => applied[field.key]) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);
  const anyDraft =
    FILTER_FIELDS.some((field) => draft[field.key]) ||
    Boolean(draftDateFrom) ||
    Boolean(draftDateTo);
  const hasActiveFilters = anyApplied;
  const canReset = anyApplied || anyDraft;

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

export type SummaryFiltersController = ReturnType<typeof useSummaryFilters>;
