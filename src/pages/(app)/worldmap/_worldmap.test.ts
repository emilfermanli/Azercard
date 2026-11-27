import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatCountByUnit, type AmountUnit } from '@/utils/amount-unit';
import { formatMapMetricExact, formatMapMetricValue } from '@/utils/map-metric';

const ALL_UNITS: AmountUnit[] = ['tam', 'min', 'mln', 'mlrd'];

describe('WorldMap unit formatting for counts, amounts, and average ticket', () => {
  it('scales transaction counts across all 4 units without ₼ symbol', () => {
    const count = 12345678;
    assert.equal(formatMapMetricValue(count, 'count', 'tam'), '12.345.678');
    assert.equal(formatMapMetricValue(count, 'count', 'min'), '12.345,68 min');
    assert.equal(formatMapMetricValue(count, 'count', 'mln'), '12,35 mln');
    assert.equal(formatMapMetricValue(count, 'count', 'mlrd'), '0,01 mlrd');
    assert.equal(formatMapMetricExact(count, 'count'), '12.345.678');

    for (const unit of ALL_UNITS) {
      assert.doesNotMatch(formatMapMetricValue(count, 'count', unit), /₼/);
    }
  });

  it('keeps average ticket in AZN across all 4 units', () => {
    const avg = 89.45;
    for (const unit of ALL_UNITS) {
      assert.equal(formatMapMetricValue(avg, 'average', unit), '89,45 ₼');
    }
    assert.equal(formatMapMetricExact(avg, 'average'), '89,45 ₼');
  });

  it('handles 0, null, tiny, and huge values without false zeros', () => {
    for (const unit of ALL_UNITS) {
      assert.equal(formatCountByUnit(null, unit), '—');
      assert.equal(formatCountByUnit(undefined, unit), '—');
    }
    assert.equal(formatCountByUnit(0, 'mln'), '0 mln');
    assert.equal(formatCountByUnit(42, 'mln'), '< 0,01 mln');
    assert.equal(formatCountByUnit(2543550000, 'mlrd'), '2,54 mlrd');
  });
});
