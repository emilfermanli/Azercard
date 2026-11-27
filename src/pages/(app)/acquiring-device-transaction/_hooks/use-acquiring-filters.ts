import { useEffect, useMemo, useState } from 'react';

import { useGetAcquiringFilterOptionsQuery } from '@/services/acquiring-device.service';
import type { AcquiringApiFilters } from '@/types/acquiring-device.type';
import { getLast12CompletedMonthsRange } from '@/utils/default-date-range';
import { FILTER_FIELDS, type AcquiringFilterKey } from '../_constants';
import type { SelectOption } from '../_types';
import { toApiDate, toDateInput } from '../_utils';

type FilterValues = Record<AcquiringFilterKey, string[]>;

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
 * Acquiring səhifəsinin filtr vəziyyəti — 11 dropdown + tarix aralığı (drawer)
 * + sağ qurğu kartlarına klik (toggleDeviceType, bütün qrafiklərə təsir edir).
 */
export function useAcquiringFilters() {
  const { data: filterOptions } = useGetAcquiringFilterOptionsQuery();
  const minInput = toDateInput(filterOptions?.minDate);
  const maxInput = toDateInput(filterOptions?.maxDate);
  const defaultRange = useMemo(
    () => getLast12CompletedMonthsRange(filterOptions?.maxDate),
    [filterOptions?.maxDate]
  );
  const defaultFromInput = defaultRange.dateFrom;
  const defaultToInput = defaultRange.dateTo;

  const [isOpen, setOpen] = useState(false);
  const [applied, setApplied] = useState<FilterValues>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<FilterValues>(EMPTY_FILTERS);

  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [draftDateFromInput, setDraftDateFromInput] = useState('');
  const [draftDateToInput, setDraftDateToInput] = useState('');

  const effectiveFrom = dateFromInput || defaultFromInput;
  const effectiveTo = dateToInput || defaultToInput;
  const fromDate = effectiveFrom ? toApiDate(effectiveFrom) : undefined;
  const toDate = effectiveTo ? toApiDate(effectiveTo) : undefined;

  const apiFilters = useMemo<AcquiringApiFilters>(() => {
    const out: AcquiringApiFilters = {};
    for (const field of FILTER_FIELDS) {
      const value = applied[field.key];
      if (value.length) out[field.apiKey] = value;
    }
    return out;
  }, [applied]);

  const options = useMemo(() => {
    const out = {} as Record<AcquiringFilterKey, SelectOption[]>;
    for (const field of FILTER_FIELDS) {
      out[field.key] = toOptions(filterOptions?.[field.optionsKey]);
    }
    return out;
  }, [filterOptions]);

  const selected = useMemo(() => {
    const out = {} as Record<AcquiringFilterKey, SelectOption[]>;
    for (const field of FILTER_FIELDS) {
      out[field.key] = options[field.key].filter((o) =>
        draft[field.key].includes(o.value)
      );
    }
    return out;
  }, [options, draft]);

  const setDraftField = (key: AcquiringFilterKey, value: string[]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  // Sağ kartdakı aktiv qurğu = `acquiringDeviceType` filtri tək dəyər olduqda.
  const activeDeviceType =
    applied.acquiringDeviceType.length === 1 ? applied.acquiringDeviceType[0] : null;

  // Kart kliki — qurğu tipini birbaşa tətbiq edir (toggle), bütün qrafiklərə təsir.
  const toggleDeviceType = (type: string) => {
    setApplied((current) => ({
      ...current,
      acquiringDeviceType:
        current.acquiringDeviceType.length === 1 &&
        current.acquiringDeviceType[0] === type
          ? []
          : [type],
    }));
  };

  const isCustomRange = (from: string, to: string) =>
    Boolean(
      (from && from !== defaultFromInput) || (to && to !== defaultToInput)
    );

  const anyApplied = FILTER_FIELDS.some((field) => applied[field.key].length);
  const anyDraft = FILTER_FIELDS.some((field) => draft[field.key].length);
  const hasActiveFilters = anyApplied || isCustomRange(dateFromInput, dateToInput);
  const canReset =
    hasActiveFilters || anyDraft || isCustomRange(draftDateFromInput, draftDateToInput);

  // Drawer açılanda qaralamanı tətbiq olunmuş dəyərlərlə doldur.
  useEffect(() => {
    if (isOpen) {
      setDraft(applied);
      setDraftDateFromInput(dateFromInput || defaultFromInput);
      setDraftDateToInput(dateToInput || defaultToInput);
    }
  }, [isOpen, applied, dateFromInput, dateToInput, defaultFromInput, defaultToInput]);

  const apply = () => {
    setApplied(draft);
    setDateFromInput(draftDateFromInput !== defaultFromInput ? draftDateFromInput : '');
    setDateToInput(draftDateToInput !== defaultToInput ? draftDateToInput : '');
    setOpen(false);
  };

  const reset = () => {
    setApplied(EMPTY_FILTERS);
    setDraft(EMPTY_FILTERS);
    setDateFromInput('');
    setDateToInput('');
    setDraftDateFromInput(defaultFromInput);
    setDraftDateToInput(defaultToInput);
    setOpen(false);
  };

  return {
    // data layer
    fromDate,
    toDate,
    apiFilters,
    activeDeviceType,
    toggleDeviceType,
    // drawer
    isOpen,
    setOpen,
    minInput,
    maxInput,
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

export type AcquiringFiltersController = ReturnType<typeof useAcquiringFilters>;
