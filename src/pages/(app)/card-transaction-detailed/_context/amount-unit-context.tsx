import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import {
  AMOUNT_UNIT_QUERY_PARAM,
  usePersistedAmountUnit,
} from '@/hooks/use-persisted-amount-unit';
import { type AmountUnit } from '@/utils/amount-unit';

export const STORAGE_KEY = 'card-transaction-detailed:amount-unit';
export const QUERY_PARAM = AMOUNT_UNIT_QUERY_PARAM;
export const DEFAULT_UNIT: AmountUnit = 'mln';

type AmountUnitContextValue = {
  unit: AmountUnit;
  setUnit: (next: AmountUnit) => void;
};

const AmountUnitContext = createContext<AmountUnitContextValue | null>(null);

export function TdAmountUnitProvider({ children }: { children: ReactNode }) {
  const { unit, setUnit } = usePersistedAmountUnit(STORAGE_KEY, DEFAULT_UNIT);

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
