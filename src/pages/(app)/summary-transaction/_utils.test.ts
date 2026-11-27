import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatAmount,
  formatCount,
  formatCountByUnit,
  formatExactAmount,
  type AmountUnit,
} from './_utils';

const ALL_UNITS: AmountUnit[] = ['tam', 'min', 'mln', 'mlrd'];

describe('SummaryTransaction unit formatting for amounts and counts', () => {
  it('scales transaction counts across all 4 units without ₼ symbol', () => {
    const count = 705646032;
    assert.equal(formatCountByUnit(count, 'tam'), '705.646.032');
    assert.equal(formatCountByUnit(count, 'min'), '705.646,03 min');
    assert.equal(formatCountByUnit(count, 'mln'), '705,65 mln');
    assert.equal(formatCountByUnit(count, 'mlrd'), '0,71 mlrd');
    assert.equal(formatCount(count), '705.646.032');

    for (const unit of ALL_UNITS) {
      assert.doesNotMatch(formatCountByUnit(count, unit), /₼/);
    }
  });

  it('scales amounts across all 4 units with ₼ and preserves exact tooltips', () => {
    const amount = 36838100000;
    assert.equal(formatAmount(amount, 'tam'), '36.838.100.000 ₼');
    assert.equal(formatAmount(amount, 'min'), '36.838.100 min ₼');
    assert.equal(formatAmount(amount, 'mln'), '36.838,1 mln ₼');
    assert.equal(formatAmount(amount, 'mlrd'), '36,84 mlrd ₼');
    assert.equal(formatExactAmount(amount), '36.838.100.000 ₼');
  });

  it('handles 0, null, undefined, tiny, and huge values without false zeros', () => {
    for (const unit of ALL_UNITS) {
      assert.equal(formatCountByUnit(null, unit), '—');
      assert.equal(formatCountByUnit(undefined, unit), '—');
    }
    assert.equal(formatCountByUnit(0, 'mln'), '0 mln');
    assert.equal(formatCountByUnit(150, 'mln'), '< 0,01 mln');
    assert.equal(formatCountByUnit(2543550000, 'mlrd'), '2,54 mlrd');
  });
});
