import { useEffect, useMemo, useRef, useState } from 'react';

import {
  useGetDevicesFiltersQuery,
  useGetDevicesLatestMonthQuery,
} from '@/services/devices.service';
import type { SelectOption } from '../_types';
import { shiftMonth, toDateInput, toDateTime, toReportMonth } from '../_utils';

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
 * Kart aktivliyi filtrlərinin bütün vəziyyəti:
 * tətbiq olunmuş dəyərlər + qaralama (draft) + dropdown seçimləri + handler-lər.
 * Data layer üçün `reportMonth`, `queryFilters`, `retailCategories` verir.
 */
export function useDeviceFilters() {
  const { data: latestMonth } = useGetDevicesLatestMonthQuery();
  const { data: filtersData } = useGetDevicesFiltersQuery();

  const [isOpen, setOpen] = useState(false);

  // Tətbiq olunmuş dəyərlər.
  const [bankName, setBankName] = useState('');
  const [regionName, setRegionName] = useState('');
  const [mccName, setMccName] = useState('');
  const [retailCategory, setRetailCategory] = useState('');
  const [monthInput, setMonthInput] = useState(''); // "YYYY-MM-DD", boş = ən son ay
  // Matris (xy-analysis) üçün tarix aralığı — boş = ən son ay.
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');

  // Qaralama (drawer-dakı seçimlər, "Təsdiq"ə qədər).
  const [draftBankName, setDraftBankName] = useState('');
  const [draftRegionName, setDraftRegionName] = useState('');
  const [draftMccName, setDraftMccName] = useState('');
  const [draftRetailCategory, setDraftRetailCategory] = useState('');
  const [draftMonthInput, setDraftMonthInput] = useState('');
  const [draftDateFromInput, setDraftDateFromInput] = useState('');
  const [draftDateToInput, setDraftDateToInput] = useState('');

  const monthInputRef = useRef<HTMLInputElement>(null);

  const reportMonth = monthInput ? toReportMonth(monthInput) : latestMonth?.reportMonth;
  const prevMonth = reportMonth ? shiftMonth(reportMonth, -1) : undefined;
  const latestInput = toDateInput(latestMonth?.reportMonth);

  // Matris tarix aralığı (boş olduqda ən son aya düşür).
  const effectiveDateFrom = dateFromInput || latestInput;
  const effectiveDateTo = dateToInput || latestInput;
  const xyDateFrom = effectiveDateFrom ? toDateTime(effectiveDateFrom) : undefined;
  const xyDateTo = effectiveDateTo ? toDateTime(effectiveDateTo) : undefined;

  // Kartlar/donut üçün (retailCategory xaric — hər kart bir kateqoriyadır).
  const baseFilters = useMemo(
    () => ({
      ...(bankName ? { bankName } : {}),
      ...(regionName ? { regionName } : {}),
      ...(mccName ? { mccName } : {}),
    }),
    [bankName, regionName, mccName]
  );
  // Cəmi/matris üçün (retailCategory daxil).
  const queryFilters = useMemo(
    () => ({
      ...baseFilters,
      ...(retailCategory ? { retailCategory } : {}),
    }),
    [baseFilters, retailCategory]
  );

  const retailCategories = useMemo(() => {
    const all = filtersData?.retailCategories ?? [];
    return retailCategory ? all.filter((category) => category === retailCategory) : all;
  }, [filtersData, retailCategory]);

  const options = useMemo(
    () => ({
      banks: toOptions(filtersData?.bankNames),
      regions: toOptions(filtersData?.regionNames),
      mccs: toOptions(filtersData?.mccNames),
      retails: toOptions(filtersData?.retailCategories),
    }),
    [filtersData]
  );

  const selected = {
    bank: options.banks.find((o) => o.value === draftBankName) ?? null,
    region: options.regions.find((o) => o.value === draftRegionName) ?? null,
    mcc: options.mccs.find((o) => o.value === draftMccName) ?? null,
    retail: options.retails.find((o) => o.value === draftRetailCategory) ?? null,
  };

  const isCustomRange = (from: string, to: string) =>
    Boolean((from && from !== latestInput) || (to && to !== latestInput));

  const hasActiveFilters = Boolean(
    bankName ||
      regionName ||
      mccName ||
      retailCategory ||
      (monthInput && monthInput !== latestInput) ||
      isCustomRange(dateFromInput, dateToInput)
  );
  const hasDraftSelection = Boolean(
    draftBankName ||
      draftRegionName ||
      draftMccName ||
      draftRetailCategory ||
      (draftMonthInput && draftMonthInput !== latestInput) ||
      isCustomRange(draftDateFromInput, draftDateToInput)
  );

  // Drawer açılanda qaralamanı tətbiq olunmuş dəyərlərlə doldur.
  useEffect(() => {
    if (isOpen) {
      setDraftBankName(bankName);
      setDraftRegionName(regionName);
      setDraftMccName(mccName);
      setDraftRetailCategory(retailCategory);
      setDraftMonthInput(monthInput || latestInput);
      setDraftDateFromInput(dateFromInput || latestInput);
      setDraftDateToInput(dateToInput || latestInput);
    }
  }, [
    isOpen,
    bankName,
    regionName,
    mccName,
    retailCategory,
    monthInput,
    dateFromInput,
    dateToInput,
    latestInput,
  ]);

  const openDatePicker = () => monthInputRef.current?.showPicker?.();

  const apply = () => {
    setBankName(draftBankName);
    setRegionName(draftRegionName);
    setMccName(draftMccName);
    setRetailCategory(draftRetailCategory);
    setMonthInput(draftMonthInput && draftMonthInput !== latestInput ? draftMonthInput : '');
    setDateFromInput(draftDateFromInput);
    setDateToInput(draftDateToInput);
    setOpen(false);
  };

  const reset = () => {
    setBankName('');
    setRegionName('');
    setMccName('');
    setRetailCategory('');
    setMonthInput('');
    setDateFromInput('');
    setDateToInput('');
    setDraftBankName('');
    setDraftRegionName('');
    setDraftMccName('');
    setDraftRetailCategory('');
    setDraftMonthInput(latestInput);
    setDraftDateFromInput(latestInput);
    setDraftDateToInput(latestInput);
    setOpen(false);
  };

  return {
    // data layer
    reportMonth,
    prevMonth,
    xyDateFrom,
    xyDateTo,
    queryFilters,
    retailCategories,
    // drawer
    isOpen,
    setOpen,
    // dropdownlar
    options,
    selected,
    draftMonthInput,
    draftDateFromInput,
    draftDateToInput,
    setDraftBankName,
    setDraftRegionName,
    setDraftMccName,
    setDraftRetailCategory,
    setDraftMonthInput,
    setDraftDateFromInput,
    setDraftDateToInput,
    // ref + handlerlər
    monthInputRef,
    openDatePicker,
    // flaglar + əməliyyatlar
    hasActiveFilters,
    canReset: hasActiveFilters || hasDraftSelection,
    apply,
    reset,
  };
}

export type DeviceFiltersController = ReturnType<typeof useDeviceFilters>;
