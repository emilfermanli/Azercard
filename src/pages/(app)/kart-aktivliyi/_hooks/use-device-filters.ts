import { useEffect, useMemo, useRef, useState } from 'react';

import {
  useGetDevicesFiltersQuery,
  useGetDevicesLatestMonthQuery,
} from '@/services/devices.service';
import type { SelectOption } from '../_types';
import { shiftMonth, toDateInput, toReportMonth } from '../_utils';

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
 * Data layer üçün `reportMonth`, `baseFilters`, `queryFilters`, `retailCategories` verir.
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

  // Qaralama (drawer-dakı seçimlər, "Təsdiq"ə qədər).
  const [draftBankName, setDraftBankName] = useState('');
  const [draftRegionName, setDraftRegionName] = useState('');
  const [draftMccName, setDraftMccName] = useState('');
  const [draftRetailCategory, setDraftRetailCategory] = useState('');
  const [draftMonthInput, setDraftMonthInput] = useState('');

  const monthInputRef = useRef<HTMLInputElement>(null);

  const reportMonth = monthInput ? toReportMonth(monthInput) : latestMonth?.reportMonth;
  const prevMonth = reportMonth ? shiftMonth(reportMonth, -1) : undefined;
  const latestInput = toDateInput(latestMonth?.reportMonth);

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

  const hasActiveFilters = Boolean(
    bankName || regionName || mccName || retailCategory || (monthInput && monthInput !== latestInput)
  );
  const hasDraftSelection = Boolean(
    draftBankName ||
      draftRegionName ||
      draftMccName ||
      draftRetailCategory ||
      (draftMonthInput && draftMonthInput !== latestInput)
  );

  // Drawer açılanda qaralamanı tətbiq olunmuş dəyərlərlə doldur.
  useEffect(() => {
    if (isOpen) {
      setDraftBankName(bankName);
      setDraftRegionName(regionName);
      setDraftMccName(mccName);
      setDraftRetailCategory(retailCategory);
      setDraftMonthInput(monthInput || latestInput);
    }
  }, [isOpen, bankName, regionName, mccName, retailCategory, monthInput, latestInput]);

  const openDatePicker = () => monthInputRef.current?.showPicker?.();

  const apply = () => {
    setBankName(draftBankName);
    setRegionName(draftRegionName);
    setMccName(draftMccName);
    setRetailCategory(draftRetailCategory);
    setMonthInput(draftMonthInput && draftMonthInput !== latestInput ? draftMonthInput : '');
    setOpen(false);
  };

  const reset = () => {
    setBankName('');
    setRegionName('');
    setMccName('');
    setRetailCategory('');
    setMonthInput('');
    setDraftBankName('');
    setDraftRegionName('');
    setDraftMccName('');
    setDraftRetailCategory('');
    setDraftMonthInput(latestInput);
    setOpen(false);
  };

  return {
    // data layer
    reportMonth,
    prevMonth,
    baseFilters,
    queryFilters,
    retailCategories,
    // drawer
    isOpen,
    setOpen,
    // dropdownlar
    options,
    selected,
    draftMonthInput,
    setDraftBankName,
    setDraftRegionName,
    setDraftMccName,
    setDraftRetailCategory,
    setDraftMonthInput,
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
