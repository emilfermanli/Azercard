import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { TransactionDetailedArgs } from '@/types/card-transaction-detailed.type';
import { COLUMNS } from './_constants';
import type { ColumnKey } from './_types';
import {
  exactMeasureValue,
  formatAmount,
  formatInt,
  formatPct,
  measureValue,
  type AmountUnit,
} from './_utils';

const ALL_UNITS: AmountUnit[] = ['tam', 'min', 'mln', 'mlrd'];

/** Pure helper mirroring useTdFilters apiArgs construction from column selections. */
function buildApiArgsFromSelections(
  selections: Record<ColumnKey, string>
): TransactionDetailedArgs {
  const out: TransactionDetailedArgs = {};
  for (const col of COLUMNS) {
    if (selections[col.key]) (out[col.apiKey] as string) = selections[col.key];
  }
  return out;
}

describe('CardTransactionDetailed unit formatting & column data swap', () => {
  it('formats measureValue and exactMeasureValue across all 4 units in AZN mode', () => {
    const row = { amount: 22123277083.97, count: 408324482 };

    assert.equal(measureValue(row, 'amount', 'tam'), '22.123.277.083,97 ₼');
    assert.equal(measureValue(row, 'amount', 'min'), '22.123.277,08 min ₼');
    assert.equal(measureValue(row, 'amount', 'mln'), '22.123,28 mln ₼');
    assert.equal(measureValue(row, 'amount', 'mlrd'), '22,12 mlrd ₼');

    // Default unit parameter is 'mln'
    assert.equal(measureValue(row, 'amount'), '22.123,28 mln ₼');

    // exactMeasureValue always returns full unscaled AZN for tooltips
    assert.equal(exactMeasureValue(row, 'amount'), '22.123.277.083,97 ₼');
  });

  it('keeps counts unscaled without unit or currency suffix in SAY mode across all 4 units', () => {
    const row = { amount: 22123277083.97, count: 408324482 };

    for (const unit of ALL_UNITS) {
      assert.equal(measureValue(row, 'count', unit), '408.324.482');
      assert.doesNotMatch(measureValue(row, 'count', unit), /min|mln|mlrd|₼/);
    }
    assert.equal(exactMeasureValue(row, 'count'), '408.324.482');
    assert.equal(formatInt(408324482), '408.324.482');
  });

  it('prevents false zeros for tiny non-zero values (< 0,01) and handles 0, -0, null, undefined', () => {
    const tinyRow = { amount: 172.36, count: 3 };
    assert.equal(measureValue(tinyRow, 'amount', 'mlrd'), '< 0,01 mlrd ₼');
    assert.equal(measureValue(tinyRow, 'amount', 'mln'), '< 0,01 mln ₼');
    assert.equal(exactMeasureValue(tinyRow, 'amount'), '172,36 ₼');

    const zeroRow = { amount: 0, count: 0 };
    assert.equal(measureValue(zeroRow, 'amount', 'tam'), '0 ₼');
    assert.equal(measureValue(zeroRow, 'amount', 'mln'), '0 mln ₼');
    assert.equal(measureValue({ amount: -0, count: -0 }, 'amount', 'mln'), '0 mln ₼');

    const nullRow = { amount: null, count: undefined };
    for (const unit of ALL_UNITS) {
      assert.equal(measureValue(nullRow, 'amount', unit), '—');
      assert.equal(measureValue(nullRow, 'count', unit), '—');
    }
    assert.equal(exactMeasureValue(nullRow, 'amount'), '—');
    assert.equal(formatAmount(null, 'mln'), '—');
    assert.equal(formatPct(30.64), '30,6%');
  });

  it('maps Bank column to TARGET_BANK_NAME (TargetBankName) and Target bank column to SOURCE_BANK_NAME (SourceBankName)', () => {
    // 1. Visual column order and titles remain unchanged:
    //    [0] Bank, [1] Acquiring qurğu, [2] İssuing kateqoriya, [3] Target bank
    assert.deepEqual(
      COLUMNS.map((c) => ({ key: c.key, title: c.title })),
      [
        { key: 'bank', title: 'Bank' },
        { key: 'device', title: 'Acquiring qurğu' },
        { key: 'issuing', title: 'İssuing kateqoriya' },
        { key: 'targetBank', title: 'Target bank' },
      ]
    );

    const bankCol = COLUMNS.find((c) => c.key === 'bank')!;
    const targetBankCol = COLUMNS.find((c) => c.key === 'targetBank')!;

    // 2. Data and subtitles are crossed:
    //    "Bank" -> TARGET_BANK_NAME / TargetBankName
    //    "Target bank" -> SOURCE_BANK_NAME / SourceBankName
    assert.equal(bankCol.subtitle, 'TARGET_BANK_NAME');
    assert.equal(bankCol.apiKey, 'TargetBankName');

    assert.equal(targetBankCol.subtitle, 'SOURCE_BANK_NAME');
    assert.equal(targetBankCol.apiKey, 'SourceBankName');

    // 3. Clicking a row in "Bank" sets TargetBankName
    const argsWhenBankClicked = buildApiArgsFromSelections({
      bank: 'Kapital Bank',
      device: '',
      issuing: '',
      targetBank: '',
    });
    assert.deepEqual(argsWhenBankClicked, { TargetBankName: 'Kapital Bank' });

    // 4. Clicking a row in "Target bank" sets SourceBankName
    const argsWhenTargetBankClicked = buildApiArgsFromSelections({
      bank: '',
      device: '',
      issuing: '',
      targetBank: 'ABB',
    });
    assert.deepEqual(argsWhenTargetBankClicked, { SourceBankName: 'ABB' });
  });
});
