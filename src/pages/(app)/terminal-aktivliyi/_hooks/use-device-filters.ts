import { useEffect, useMemo, useState } from 'react';

import {
  useGetDevicesFiltersQuery,
  // useGetDevicesLatestMonthQuery,
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
  // const { data: latestMonth } = useGetDevicesLatestMonthQuery();
  //latestMonth?.reportMonth ?? '2004-04-01';
  const latestReportMonth = '2004-04-01';
  const { data: filtersData } = useGetDevicesFiltersQuery();

  const [isOpen, setOpen] = useState(false);

  // Tətbiq olunmuş dəyərlər.
  const [bankName, setBankName] = useState('');
  const [regionName, setRegionName] = useState('');
  const [mccName, setMccName] = useState('');
  const [retailCategory, setRetailCategory] = useState('');
  // Matris tarix aralığı — boş = ən son ay; Son həm də reportMonth mənbəyidir.
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');

  // Qaralama (drawer-dakı seçimlər, "Təsdiq"ə qədər).
  const [draftBankName, setDraftBankName] = useState('');
  const [draftRegionName, setDraftRegionName] = useState('');
  const [draftMccName, setDraftMccName] = useState('');
  const [draftRetailCategory, setDraftRetailCategory] = useState('');
  const [draftDateFromInput, setDraftDateFromInput] = useState('');
  const [draftDateToInput, setDraftDateToInput] = useState('');

  const latestInput = toDateInput(latestReportMonth);

  // Matris tarix aralığı (boş olduqda ən son aya düşür).
  const effectiveDateFrom = dateFromInput || latestInput;
  const effectiveDateTo = dateToInput || latestInput;
  const xyDateFrom = effectiveDateFrom ? toDateTime(effectiveDateFrom) : undefined;
  const xyDateTo = effectiveDateTo ? toDateTime(effectiveDateTo) : undefined;

  // Cəmi, kartlar və trend — matrisin Son tarixinin ayı.
  const reportMonth = toReportMonth(effectiveDateTo);
  const prevMonth = reportMonth ? shiftMonth(reportMonth, -1) : undefined;

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
      isCustomRange(dateFromInput, dateToInput)
  );
  const hasDraftSelection = Boolean(
    draftBankName ||
      draftRegionName ||
      draftMccName ||
      draftRetailCategory ||
      isCustomRange(draftDateFromInput, draftDateToInput)
  );

  // Drawer açılanda qaralamanı tətbiq olunmuş dəyərlərlə doldur.
  useEffect(() => {
    if (isOpen) {
      setDraftBankName(bankName);
      setDraftRegionName(regionName);
      setDraftMccName(mccName);
      setDraftRetailCategory(retailCategory);
      setDraftDateFromInput(dateFromInput || latestInput);
      setDraftDateToInput(dateToInput || latestInput);
    }
  }, [
    isOpen,
    bankName,
    regionName,
    mccName,
    retailCategory,
    dateFromInput,
    dateToInput,
    latestInput,
  ]);

  const apply = () => {
    setBankName(draftBankName);
    setRegionName(draftRegionName);
    setMccName(draftMccName);
    setRetailCategory(draftRetailCategory);
    setDateFromInput(draftDateFromInput !== latestInput ? draftDateFromInput : '');
    setDateToInput(draftDateToInput !== latestInput ? draftDateToInput : '');
    setOpen(false);
  };

  const reset = () => {
    setBankName('');
    setRegionName('');
    setMccName('');
    setRetailCategory('');
    setDateFromInput('');
    setDateToInput('');
    setDraftBankName('');
    setDraftRegionName('');
    setDraftMccName('');
    setDraftRetailCategory('');
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
    draftDateFromInput,
    draftDateToInput,
    setDraftBankName,
    setDraftRegionName,
    setDraftMccName,
    setDraftRetailCategory,
    setDraftDateFromInput,
    setDraftDateToInput,
    // flaglar + əməliyyatlar
    hasActiveFilters,
    canReset: hasActiveFilters || hasDraftSelection,
    apply,
    reset,
  };
}

export type DeviceFiltersController = ReturnType<typeof useDeviceFilters>;
