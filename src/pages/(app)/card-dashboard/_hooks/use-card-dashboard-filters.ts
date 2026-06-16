import { useEffect, useMemo, useState } from 'react';

import { useGetCardDashboardFiltersQuery } from '@/services/card-dashboard.service';
import type { CardDashboardArgs } from '@/types/card-dashboard.type';
import { FILTER_FIELDS, type CardDashFilterKey } from '../_constants';
import type { SelectOption } from '../_types';

type FilterValues = Record<CardDashFilterKey, string>;

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
 * CardDashboard filtrlərinin vəziyyəti — 7 tək-seçimli dropdown + kontaktsız (3 vəziyyət)
 * + tarix aralığı. API arqumentlərini (`apiArgs`) data layer üçün hazırlayır.
 */
export function useCardDashboardFilters() {
  const { data: filterOptions } = useGetCardDashboardFiltersQuery();

  const [isOpen, setOpen] = useState(false);
  const [applied, setApplied] = useState<FilterValues>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<FilterValues>(EMPTY_FILTERS);

  const [contactless, setContactless] = useState('');
  const [draftContactless, setDraftContactless] = useState('');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');

  const apiArgs = useMemo<CardDashboardArgs>(() => {
    const out: CardDashboardArgs = {};
    for (const field of FILTER_FIELDS) {
      const value = applied[field.key];
      if (value) (out[field.apiKey] as string) = value;
    }
    if (contactless === 'true') out.IsContactless = true;
    if (contactless === 'false') out.IsContactless = false;
    if (dateFrom) out.DateFrom = `${dateFrom}T00:00:00`;
    if (dateTo) out.DateTo = `${dateTo}T00:00:00`;
    return out;
  }, [applied, contactless, dateFrom, dateTo]);

  const options = useMemo(() => {
    const out = {} as Record<CardDashFilterKey, SelectOption[]>;
    for (const field of FILTER_FIELDS) {
      out[field.key] = toOptions(filterOptions?.[field.optionsKey]);
    }
    return out;
  }, [filterOptions]);

  const selected = useMemo(() => {
    const out = {} as Record<CardDashFilterKey, SelectOption | null>;
    for (const field of FILTER_FIELDS) {
      out[field.key] =
        options[field.key].find((o) => o.value === draft[field.key]) ?? null;
    }
    return out;
  }, [options, draft]);

  const setDraftField = (key: CardDashFilterKey, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const anyApplied =
    FILTER_FIELDS.some((field) => applied[field.key]) ||
    Boolean(contactless) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);
  const anyDraft =
    FILTER_FIELDS.some((field) => draft[field.key]) ||
    Boolean(draftContactless) ||
    Boolean(draftDateFrom) ||
    Boolean(draftDateTo);
  const hasActiveFilters = anyApplied;
  const canReset = anyApplied || anyDraft;

  // Drawer açılanda qaralamanı tətbiq olunmuş dəyərlərlə doldur.
  useEffect(() => {
    if (isOpen) {
      setDraft(applied);
      setDraftContactless(contactless);
      setDraftDateFrom(dateFrom);
      setDraftDateTo(dateTo);
    }
  }, [isOpen, applied, contactless, dateFrom, dateTo]);

  const apply = () => {
    setApplied(draft);
    setContactless(draftContactless);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setOpen(false);
  };

  const reset = () => {
    setApplied(EMPTY_FILTERS);
    setDraft(EMPTY_FILTERS);
    setContactless('');
    setDraftContactless('');
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
    draftContactless,
    setDraftContactless,
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

export type CardDashboardFiltersController = ReturnType<typeof useCardDashboardFilters>;
