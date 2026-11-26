import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import { isAmountUnit, type AmountUnit } from '../../card-dashboard/_format';

export const STORAGE_KEY = 'card-transaction-detailed:amount-unit';
export const QUERY_PARAM = 'unit';
export const DEFAULT_UNIT: AmountUnit = 'mln';

type AmountUnitContextValue = {
  unit: AmountUnit;
  setUnit: (next: AmountUnit) => void;
};

const AmountUnitContext = createContext<AmountUnitContextValue | null>(null);

function readStoredUnit(): AmountUnit | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isAmountUnit(raw) ? raw : null;
  } catch {
    return null;
  }
}

function writeStoredUnit(unit: AmountUnit): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, unit);
  } catch {
    // storage mövcud deyilsə səssiz keç
  }
}

export function TdAmountUnitProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParam = searchParams.get(QUERY_PARAM);
  const urlUnit = isAmountUnit(urlParam) ? urlParam : null;
  const storedUnit = readStoredUnit();

  const unit: AmountUnit = urlUnit ?? storedUnit ?? DEFAULT_UNIT;

  useEffect(() => {
    if (urlUnit) {
      if (readStoredUnit() !== urlUnit) {
        writeStoredUnit(urlUnit);
      }
      return;
    }

    if (storedUnit && storedUnit !== DEFAULT_UNIT) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(QUERY_PARAM, storedUnit);
          return next;
        },
        { replace: true }
      );
    }
  }, [urlUnit, storedUnit, setSearchParams]);

  const setUnit = useCallback(
    (nextUnit: AmountUnit) => {
      writeStoredUnit(nextUnit);
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          updated.set(QUERY_PARAM, nextUnit);
          return updated;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const value = useMemo<AmountUnitContextValue>(
    () => ({ unit, setUnit }),
    [unit, setUnit]
  );

  return (
    <AmountUnitContext.Provider value={value}>
      {children}
    </AmountUnitContext.Provider>
  );
}

export function useTdAmountUnit(): AmountUnitContextValue {
  const ctx = useContext(AmountUnitContext);
  if (!ctx) {
    throw new Error('useTdAmountUnit must be used inside TdAmountUnitProvider');
  }
  return ctx;
}
