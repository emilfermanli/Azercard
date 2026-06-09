import { useEffect, useMemo, useState } from 'react';

import { useGetCardFilterOptionsQuery } from '@/services/cards.service';
import type { CardApiFilters } from '@/types/cards.type';
import { FILTER_FIELDS, type CardFilterKey } from '../_constants';
import type { SelectOption } from '../_types';
import { toDateInput, toReportMonth } from '../_utils';

type FilterValues = Record<CardFilterKey, string[]>;

const EMPTY_FILTERS: FilterValues = FILTER_FIELDS.reduce(
  (acc, field) => ({ ...acc, [field.key]: [] }),
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
 * Kart portfoliyosu filtrlərinin vəziyyəti (8 dropdown + tarix aralığı).
 * Data layer üçün `snapshotMonth`, `rangeFrom`, `rangeTo`, `apiFilters` verir.
 */
export function useCardFilters() {
  const { data: filterOptions } = useGetCardFilterOptionsQuery();
  const latestInput = toDateInput(filterOptions?.maxMonth);

  const [isOpen, setOpen] = useState(false);
  const [applied, setApplied] = useState<FilterValues>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<FilterValues>(EMPTY_FILTERS);

  // Tarix aralığı — boş = ən son ay.
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [draftDateFromInput, setDraftDateFromInput] = useState('');
  const [draftDateToInput, setDraftDateToInput] = useState('');

  const effectiveFrom = dateFromInput || latestInput;
  const effectiveTo = dateToInput || latestInput;
  // Matris (xy-chart) üçün tam aralıq.
  const rangeFrom = effectiveFrom ? toReportMonth(effectiveFrom) : undefined;
  const rangeTo = effectiveTo ? toReportMonth(effectiveTo) : undefined;
  // Cəmi/kartlar/donut üçün tək ay = aralığın sonu.
  const snapshotMonth = rangeTo;

  const apiFilters = useMemo<CardApiFilters>(() => {
    const out: CardApiFilters = {};
    for (const field of FILTER_FIELDS) {
      const value = applied[field.key];
      if (value.length) out[field.apiKey] = value;
    }
    return out;
  }, [applied]);

  const options = useMemo(() => {
    const out = {} as Record<CardFilterKey, SelectOption[]>;
    for (const field of FILTER_FIELDS) {
      out[field.key] = toOptions(filterOptions?.[field.optionsKey]);
    }
    return out;
  }, [filterOptions]);

  const selected = useMemo(() => {
    const out = {} as Record<CardFilterKey, SelectOption[]>;
    for (const field of FILTER_FIELDS) {
      out[field.key] = options[field.key].filter((o) =>
        draft[field.key].includes(o.value)
      );
    }
    return out;
  }, [options, draft]);

  const setDraftField = (key: CardFilterKey, value: string[]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const isCustomRange = (from: string, to: string) =>
    Boolean((from && from !== latestInput) || (to && to !== latestInput));

  const anyApplied = FILTER_FIELDS.some((field) => applied[field.key].length);
  const anyDraft = FILTER_FIELDS.some((field) => draft[field.key].length);
  const hasActiveFilters = anyApplied || isCustomRange(dateFromInput, dateToInput);
  const canReset =
    hasActiveFilters || anyDraft || isCustomRange(draftDateFromInput, draftDateToInput);

  // Drawer açılanda qaralamanı tətbiq olunmuş dəyərlərlə doldur.
  useEffect(() => {
    if (isOpen) {
      setDraft(applied);
      setDraftDateFromInput(dateFromInput || latestInput);
      setDraftDateToInput(dateToInput || latestInput);
    }
  }, [isOpen, applied, dateFromInput, dateToInput, latestInput]);

  const apply = () => {
    setApplied(draft);
    setDateFromInput(draftDateFromInput !== latestInput ? draftDateFromInput : '');
    setDateToInput(draftDateToInput !== latestInput ? draftDateToInput : '');
    setOpen(false);
  };

  const reset = () => {
    setApplied(EMPTY_FILTERS);
    setDraft(EMPTY_FILTERS);
    setDateFromInput('');
    setDateToInput('');
    setDraftDateFromInput(latestInput);
    setDraftDateToInput(latestInput);
    setOpen(false);
  };

  return {
    // data layer
    snapshotMonth,
    rangeFrom,
    rangeTo,
    apiFilters,
    // drawer
    isOpen,
    setOpen,
    options,
    selected,
    draft,
    setDraftField,
    draftDateFromInput,
    draftDateToInput,
    setDraftDateFromInput,
    setDraftDateToInput,
    hasActiveFilters,
    canReset,
    apply,
    reset,
  };
}

export type CardFiltersController = ReturnType<typeof useCardFilters>;
