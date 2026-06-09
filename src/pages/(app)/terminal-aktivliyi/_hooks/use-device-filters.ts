import { useEffect, useMemo, useState } from 'react';

import {
  useGetDevicesFiltersQuery,
  // useGetDevicesLatestMonthQuery,
} from '@/services/devices.service';
import type { DeviceBaseFilters } from '@/types/devices.type';
import {
  SHARE_DIMENSION_DEFAULT,
  SHARE_DIMENSION_OPTIONS,
  type ShareDimensionValue,
} from '../_constants';
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
 * Data layer üçün `reportMonth`, `prevMonth`, tarix aralığı və `queryFilters` verir.
 */
export function useDeviceFilters() {
  // const { data: latestMonth } = useGetDevicesLatestMonthQuery();
  //latestMonth?.reportMonth ?? '2004-04-01';
  const latestReportMonth = '2004-04-01';
  const { data: filtersData } = useGetDevicesFiltersQuery();

  const [isOpen, setOpen] = useState(false);

  // Tətbiq olunmuş dəyərlər (çox seçimli → massiv).
  const [bankNames, setBankNames] = useState<string[]>([]);
  const [regionNames, setRegionNames] = useState<string[]>([]);
  const [mccNames, setMccNames] = useState<string[]>([]);
  const [retailCategories, setRetailCategories] = useState<string[]>([]);
  // "Bölgü" — share endpointinin `dimension`-ı (tək seçim, default Terminal).
  const [shareDimension, setShareDimension] =
    useState<ShareDimensionValue>(SHARE_DIMENSION_DEFAULT);
  // Matris tarix aralığı — boş = ən son ay; Son həm də reportMonth mənbəyidir.
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');

  // Qaralama (drawer-dakı seçimlər, "Təsdiq"ə qədər).
  const [draftBankNames, setDraftBankNames] = useState<string[]>([]);
  const [draftRegionNames, setDraftRegionNames] = useState<string[]>([]);
  const [draftMccNames, setDraftMccNames] = useState<string[]>([]);
  const [draftRetailCategories, setDraftRetailCategories] = useState<string[]>([]);
  const [draftShareDimension, setDraftShareDimension] =
    useState<ShareDimensionValue>(SHARE_DIMENSION_DEFAULT);
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

  // Matris (xy-analysis) üçün filtrlər — çox seçimli massivlər (boşları atılır).
  const queryFilters = useMemo<DeviceBaseFilters>(
    () => ({
      ...(bankNames.length ? { bankNames } : {}),
      ...(regionNames.length ? { regionNames } : {}),
      ...(mccNames.length ? { mccNames } : {}),
      ...(retailCategories.length ? { retailCategories } : {}),
    }),
    [bankNames, regionNames, mccNames, retailCategories]
  );

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
    banks: options.banks.filter((o) => draftBankNames.includes(o.value)),
    regions: options.regions.filter((o) => draftRegionNames.includes(o.value)),
    mccs: options.mccs.filter((o) => draftMccNames.includes(o.value)),
    retails: options.retails.filter((o) => draftRetailCategories.includes(o.value)),
    dimension:
      SHARE_DIMENSION_OPTIONS.find((o) => o.value === draftShareDimension) ?? null,
  };

  const isCustomRange = (from: string, to: string) =>
    Boolean((from && from !== latestInput) || (to && to !== latestInput));

  const hasActiveFilters = Boolean(
    bankNames.length ||
      regionNames.length ||
      mccNames.length ||
      retailCategories.length ||
      shareDimension !== SHARE_DIMENSION_DEFAULT ||
      isCustomRange(dateFromInput, dateToInput)
  );
  const hasDraftSelection = Boolean(
    draftBankNames.length ||
      draftRegionNames.length ||
      draftMccNames.length ||
      draftRetailCategories.length ||
      draftShareDimension !== SHARE_DIMENSION_DEFAULT ||
      isCustomRange(draftDateFromInput, draftDateToInput)
  );

  // Drawer açılanda qaralamanı tətbiq olunmuş dəyərlərlə doldur.
  useEffect(() => {
    if (isOpen) {
      setDraftBankNames(bankNames);
      setDraftRegionNames(regionNames);
      setDraftMccNames(mccNames);
      setDraftRetailCategories(retailCategories);
      setDraftShareDimension(shareDimension);
      setDraftDateFromInput(dateFromInput || latestInput);
      setDraftDateToInput(dateToInput || latestInput);
    }
  }, [
    isOpen,
    bankNames,
    regionNames,
    mccNames,
    retailCategories,
    shareDimension,
    dateFromInput,
    dateToInput,
    latestInput,
  ]);

  const apply = () => {
    setBankNames(draftBankNames);
    setRegionNames(draftRegionNames);
    setMccNames(draftMccNames);
    setRetailCategories(draftRetailCategories);
    setShareDimension(draftShareDimension);
    setDateFromInput(draftDateFromInput !== latestInput ? draftDateFromInput : '');
    setDateToInput(draftDateToInput !== latestInput ? draftDateToInput : '');
    setOpen(false);
  };

  const reset = () => {
    setBankNames([]);
    setRegionNames([]);
    setMccNames([]);
    setRetailCategories([]);
    setShareDimension(SHARE_DIMENSION_DEFAULT);
    setDateFromInput('');
    setDateToInput('');
    setDraftBankNames([]);
    setDraftRegionNames([]);
    setDraftMccNames([]);
    setDraftRetailCategories([]);
    setDraftShareDimension(SHARE_DIMENSION_DEFAULT);
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
    shareDimension,
    // drawer
    isOpen,
    setOpen,
    // dropdownlar
    options,
    selected,
    draftDateFromInput,
    draftDateToInput,
    setDraftBankNames,
    setDraftRegionNames,
    setDraftMccNames,
    setDraftRetailCategories,
    setDraftShareDimension,
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
