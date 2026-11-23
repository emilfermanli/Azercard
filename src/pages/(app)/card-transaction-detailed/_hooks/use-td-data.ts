import { useMemo } from 'react';

import { useDebouncedValue } from '@/hooks';
import {
  useGetTdBanksQuery,
  useGetTdDevicesQuery,
  useGetTdSummaryQuery,
} from '@/services/card-transaction-detailed.service';
import type { TransactionDetailedArgs } from '@/types/card-transaction-detailed.type';
import type { ColumnKey, ColumnRow, Measure } from '../_types';
import { labelText, rowValue } from '../_utils';

type DataArgs = {
  apiArgs: TransactionDetailedArgs;
  measure: Measure;
  selections: Record<ColumnKey, string>;
  visible: Record<ColumnKey, boolean>;
};

type RawRow = {
  value: string;
  amount: number;
  count: number;
  changePercent: number;
  selected: boolean;
};

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
    changePercent: r.changePercent,
    selected: r.selected,
  }));
}

/**
 * Sətrin seçili olub-olmaması — yalnız aktiv (boş olmayan) seçim üçün.
 * Boş `deviceType`/`label` dəyəri default boş seçimlə üst-üstə düşməsin deyə vacibdir.
 */
const isSelected = (selection: string, value: string): boolean =>
  Boolean(selection) && selection === value;

/** Args-dan bir filtri çıxarır — sütunun öz seçimi onun öz siyahısına təsir etməsin. */
function without(
  args: TransactionDetailedArgs,
  key: keyof TransactionDetailedArgs
): TransactionDetailedArgs {
  if (!(key in args)) return args;
  const next = { ...args };
  delete next[key];
  return next;
}

export function useTdData({ apiArgs, measure, selections, visible }: DataArgs) {
  const debouncedArgs = useDebouncedValue(apiArgs, 150);

  // Cross-filter: hər sütun DİGƏR sütunların seçiminə görə filtrlənir, amma
  // ÖZ seçimini istisna edir — beləliklə seçim edəndə həmin sütun tam siyahı və
  // eyni sıra ilə qalır (seçilmiş element öz yerində vurğulanır).
  // KPI isə bütün seçimlərə görə filtrlənmiş ümumi cəmi göstərir (tam args).
  const issuingArgs = without(debouncedArgs, 'IssuingCategory');
  const targetArgs = without(debouncedArgs, 'TargetBankName');
  const bankArgs = without(debouncedArgs, 'SourceBankName');
  const deviceArgs = without(debouncedArgs, 'AcquiringDevice');

  const { data: summary, isFetching: f1 } = useGetTdSummaryQuery(debouncedArgs);
  const { data: issuingSummary, isFetching: fi } = useGetTdSummaryQuery(issuingArgs, {
    skip: !visible.issuing,
  });
  const { data: targetSummary, isFetching: ftb } = useGetTdSummaryQuery(targetArgs, {
    skip: !visible.targetBank,
  });
  const { data: banks, isFetching: f2 } = useGetTdBanksQuery(bankArgs, {
    skip: !visible.bank,
  });
  const { data: devices, isFetching: f3 } = useGetTdDevicesQuery(deviceArgs, {
    skip: !visible.device,
  });

  const bankRows = useMemo<ColumnRow[]>(
    () =>
      toColumnRows(
        (banks ?? []).map((b) => ({
          value: b.bankName,
          amount: b.amount,
          count: b.count,
          changePercent: b.changePercent,
          selected: isSelected(selections.bank, b.bankName),
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
          changePercent: d.changePercent,
          selected: isSelected(selections.device, d.deviceType),
        })),
        measure
      ),
    [devices, selections.device, measure]
  );

  const issuingRows = useMemo<ColumnRow[]>(
    () =>
      toColumnRows(
        (issuingSummary?.issuingCategories ?? []).map((i) => ({
          value: i.label,
          amount: i.amount,
          count: i.count,
          changePercent: i.changePercent,
          selected: isSelected(selections.issuing, i.label),
        })),
        measure
      ),
    [issuingSummary, selections.issuing, measure]
  );

  const targetBankRows = useMemo<ColumnRow[]>(
    () =>
      toColumnRows(
        (targetSummary?.targetBanks ?? []).map((b) => ({
          value: b.bankName,
          amount: b.amount,
          count: b.count,
          changePercent: b.changePercent,
          selected: isSelected(selections.targetBank, b.bankName),
        })),
        measure
      ),
    [targetSummary, selections.targetBank, measure]
  );

  const columnData: Record<ColumnKey, ColumnRow[]> = {
    bank: bankRows,
    device: deviceRows,
    issuing: issuingRows,
    targetBank: targetBankRows,
  };

  // Hər sütun öz sorğusundan gəlir — yüklənmə vəziyyəti də ona uyğun.
  const loading: Record<ColumnKey, boolean> = {
    bank: f2,
    device: f3,
    issuing: fi,
    targetBank: ftb,
  };

  return {
    kpi: summary?.kpi,
    columnData,
    loading,
    isFetching: f1 || fi || ftb || f2 || f3,
  };
}
