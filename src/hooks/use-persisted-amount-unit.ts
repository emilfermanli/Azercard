import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { isAmountUnit, type AmountUnit } from '@/utils/amount-unit';

export const AMOUNT_UNIT_QUERY_PARAM = 'unit';

function readStoredUnit(storageKey: string): AmountUnit | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return isAmountUnit(raw) ? raw : null;
  } catch {
    return null;
  }
}

function writeStoredUnit(storageKey: string, unit: AmountUnit): void {
  try {
    window.localStorage.setItem(storageKey, unit);
  } catch {
    // storage mövcud deyilsə səssiz keç
  }
}

/**
 * URL `?unit=` parametri və `localStorage` ilə sinxronizasiya olunan məbləğ vahidi state-i.
 */
export function usePersistedAmountUnit(
  storageKey: string,
  defaultUnit: AmountUnit = 'mln'
): { unit: AmountUnit; setUnit: (next: AmountUnit) => void } {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParam = searchParams.get(AMOUNT_UNIT_QUERY_PARAM);
  const urlUnit = isAmountUnit(urlParam) ? urlParam : null;
  const storedUnit = readStoredUnit(storageKey);

  const unit: AmountUnit = urlUnit ?? storedUnit ?? defaultUnit;

  useEffect(() => {
    if (urlUnit) {
      if (readStoredUnit(storageKey) !== urlUnit) {
        writeStoredUnit(storageKey, urlUnit);
      }
      return;
    }

    if (storedUnit && storedUnit !== defaultUnit) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(AMOUNT_UNIT_QUERY_PARAM, storedUnit);
          return next;
        },
        { replace: true }
      );
    }
  }, [urlUnit, storedUnit, storageKey, defaultUnit, setSearchParams]);

  const setUnit = useCallback(
    (nextUnit: AmountUnit) => {
      writeStoredUnit(storageKey, nextUnit);
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          updated.set(AMOUNT_UNIT_QUERY_PARAM, nextUnit);
          return updated;
        },
        { replace: true }
      );
    },
    [storageKey, setSearchParams]
  );

  return { unit, setUnit };
}
