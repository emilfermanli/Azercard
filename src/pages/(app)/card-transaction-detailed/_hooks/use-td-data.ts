import { useMemo } from 'react';

import {
  useGetTdBanksQuery,
  useGetTdDevicesQuery,
  useGetTdSummaryQuery,
} from '@/services/card-transaction-detailed.service';
import type { TransactionDetailedArgs } from '@/types/card-transaction-detailed.type';
import { MEASURE_API } from '../_constants';
import type { ColumnKey, ColumnRow, Measure } from '../_types';
import { labelText, rowValue } from '../_utils';

type DataArgs = {
  apiArgs: TransactionDetailedArgs;
  measure: Measure;
  selections: Record<ColumnKey, string>;
};

type RawRow = { value: string; amount: number; count: number; selected: boolean };

/**
 * Sütun faizini seçilmiş göstərici (məbləğ/say) üzrə klient tərəfdə hesablayır —
 * backend `percent` sahəsi həmişə ölçüyə uyğun yenilənmir.
 */
function toColumnRows(raw: RawRow[], measure: Measure): ColumnRow[] {
  const total = raw.reduce((sum, r) => sum + rowValue(r, measure), 0);
  return raw.map((r) => ({
    value: r.value,
    label: labelText(r.value),
    amount: r.amount,
    count: r.count,
    percent: total ? (rowValue(r, measure) / total) * 100 : 0,
    selected: r.selected,
  }));
}

export function useTdData({ apiArgs, measure, selections }: DataArgs) {
  const args: TransactionDetailedArgs = { ...apiArgs, Measure: MEASURE_API[measure] };

  const { data: summary, isFetching: f1 } = useGetTdSummaryQuery(args);
  const { data: banks, isFetching: f2 } = useGetTdBanksQuery(args);
  const { data: devices, isFetching: f3 } = useGetTdDevicesQuery(args);

  const bankRows = useMemo<ColumnRow[]>(
    () =>
      toColumnRows(
        (banks ?? []).map((b) => ({
          value: b.bankName,
          amount: b.amount,
          count: b.count,
          selected: selections.bank === b.bankName,
        })),
        measure
      ),
    [banks, selections.bank, measure]
  );

  const deviceRows = useMemo<ColumnRow[]>(
    () =>
      toColumnRows(
        (devices ?? []).map((d) => ({
          value: d.deviceType,
          amount: d.amount,
          count: d.count,
          selected: selections.device === d.deviceType,
        })),
        measure
      ),
    [devices, selections.device, measure]
  );

  const issuingRows = useMemo<ColumnRow[]>(
    () =>
      toColumnRows(
        (summary?.issuingCategories ?? []).map((i) => ({
          value: i.label,
          amount: i.amount,
          count: i.count,
          selected: selections.issuing === i.label,
        })),
        measure
      ),
    [summary, selections.issuing, measure]
  );

  const targetBankRows = useMemo<ColumnRow[]>(
    () =>
      toColumnRows(
        (summary?.targetBanks ?? []).map((b) => ({
          value: b.bankName,
          amount: b.amount,
          count: b.count,
          selected: selections.targetBank === b.bankName,
        })),
        measure
      ),
    [summary, selections.targetBank, measure]
  );

  const columnData: Record<ColumnKey, ColumnRow[]> = {
    bank: bankRows,
    device: deviceRows,
    issuing: issuingRows,
    targetBank: targetBankRows,
  };

  return {
    kpi: summary?.kpi,
    columnData,
    isFetching: f1 || f2 || f3,
  };
}
