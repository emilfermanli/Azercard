import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  AMOUNT_UNIT_CONFIG,
  APP_LOCALE,
  buildCountAxisTicks,
  buildMetricAxisTicks,
  buildUnitAxisTicks,
  formatAmount,
  formatCount,
  formatCountByUnit,
  formatExactAmount,
  formatMetricExactValue,
  formatMetricValue,
  formatPct,
  getMetricUnitTag,
  type AmountUnit,
} from './_format';

const ALL_UNITS: AmountUnit[] = ['tam', 'min', 'mln', 'mlrd'];

describe('CardDashboard formatting helpers', () => {
  it('uses az-AZ locale and exact divisors 1 / 1e3 / 1e6 / 1e9', () => {
    assert.equal(APP_LOCALE, 'az-AZ');
    assert.equal(AMOUNT_UNIT_CONFIG.tam.divisor, 1);
    assert.equal(AMOUNT_UNIT_CONFIG.min.divisor, 1e3);
    assert.equal(AMOUNT_UNIT_CONFIG.mln.divisor, 1e6);
    assert.equal(AMOUNT_UNIT_CONFIG.mlrd.divisor, 1e9);
  });

  it('formats 0 and -0 identically without false minus sign', () => {
    assert.equal(formatAmount(0, 'tam'), '0 ₼');
    assert.equal(formatAmount(0, 'min'), '0 min ₼');
    assert.equal(formatAmount(0, 'mln'), '0 mln ₼');
    assert.equal(formatAmount(0, 'mlrd'), '0 mlrd ₼');

    for (const unit of ALL_UNITS) {
      assert.equal(formatAmount(-0, unit), formatAmount(0, unit));
      assert.equal(
        formatAmount(0, unit, { includeCurrency: false, bareZero: true }),
        '0'
      );
      assert.equal(
        formatAmount(-0, unit, { includeCurrency: false, bareZero: true }),
        '0'
      );
    }
    assert.equal(formatExactAmount(0), '0 ₼');
    assert.equal(formatExactAmount(-0), '0 ₼');
  });

  it('handles null, undefined, NaN and Infinity safely', () => {
    const invalidInputs: Array<number | null | undefined> = [
      null,
      undefined,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ];
    for (const value of invalidInputs) {
      for (const unit of ALL_UNITS) {
        assert.equal(formatAmount(value, unit), '—');
      }
      assert.equal(formatExactAmount(value), '—');
      assert.equal(formatCount(value), '—');
      assert.equal(formatPct(value), '—');
    }
  });

  it('formats negative values across all 4 units', () => {
    assert.equal(formatAmount(-1234567.89, 'tam'), '-1.234.567,89 ₼');
    assert.equal(formatAmount(-1234567.89, 'min'), '-1.234,57 min ₼');
    assert.equal(formatAmount(-1234567.89, 'mln'), '-1,23 mln ₼');
    assert.equal(formatAmount(-1234567.89, 'mlrd'), '> -0,01 mlrd ₼');
    assert.equal(formatAmount(-0.004, 'tam'), '> -0,01 ₼');
    assert.equal(formatExactAmount(-0.004), '-0,004 ₼');
  });

  it('never formats non-zero tiny values (e.g. 0.004 or 59.7 in mlrd) as "0"', () => {
    for (const unit of ALL_UNITS) {
      const tiny = formatAmount(0.004, unit);
      assert.ok(tiny.startsWith('< 0,01'), `Expected < 0,01 for ${unit}, got ${tiny}`);
      assert.notEqual(tiny, '0 ₼');
      assert.notEqual(tiny, `0 ${AMOUNT_UNIT_CONFIG[unit].suffix} ₼`);
    }

    assert.equal(formatAmount(59.7, 'mlrd'), '< 0,01 mlrd ₼');
    assert.equal(formatAmount(172.36, 'mlrd'), '< 0,01 mlrd ₼');
    assert.equal(formatAmount(725513.13, 'mlrd'), '< 0,01 mlrd ₼');

    assert.equal(formatExactAmount(0.004), '0,004 ₼');
    assert.equal(formatExactAmount(59.7), '59,7 ₼');
    assert.equal(formatExactAmount(172.36), '172,36 ₼');
  });

  it('formats large and live-API values accurately across all 4 units', () => {
    // Live CardDashboard API dəyəri: 54.195.309,27 AZN
    const liveTotal = 54195309.27;
    assert.equal(formatAmount(liveTotal, 'tam'), '54.195.309,27 ₼');
    assert.equal(formatAmount(liveTotal, 'min'), '54.195,31 min ₼');
    assert.equal(formatAmount(liveTotal, 'mln'), '54,2 mln ₼');
    assert.equal(formatAmount(liveTotal, 'mlrd'), '0,05 mlrd ₼');

    // Çox böyük məbləğ (151.803.420.000.000 AZN)
    const huge = 151803420000000;
    assert.equal(formatAmount(huge, 'tam'), '151.803.420.000.000 ₼');
    assert.equal(formatAmount(huge, 'min'), '151.803.420.000 min ₼');
    assert.equal(formatAmount(huge, 'mln'), '151.803.420 mln ₼');
    assert.equal(formatAmount(huge, 'mlrd'), '151.803,42 mlrd ₼');
  });

  it('formats transaction counts without ₼ symbol across all 4 units, 0, null, tiny, huge, negative', () => {
    assert.equal(formatCount(0), '0');
    assert.equal(formatCount(-0), '0');
    assert.equal(formatCount(2543.55), '2.544');
    assert.equal(formatCount(314428), '314.428');
    assert.equal(formatCount(2543550000), '2.543.550.000');
    assert.doesNotMatch(formatCount(2543550000), /min|mln|mlrd|₼/);

    for (const unit of ALL_UNITS) {
      assert.equal(formatCountByUnit(null, unit), '—');
      assert.equal(formatCountByUnit(undefined, unit), '—');
      assert.equal(formatCountByUnit(Number.NaN, unit), '—');
      assert.equal(formatCountByUnit(Number.POSITIVE_INFINITY, unit), '—');
      assert.doesNotMatch(formatCountByUnit(314428, unit), /₼/);
      assert.doesNotMatch(formatCountByUnit(0, unit), /^-/);
      assert.doesNotMatch(formatCountByUnit(-0, unit), /^-/);
      assert.equal(formatCountByUnit(-0, unit), formatCountByUnit(0, unit));
    }

    assert.equal(formatCountByUnit(0, 'tam'), '0');
    assert.equal(formatCountByUnit(0, 'min'), '0 min');
    assert.equal(formatCountByUnit(0, 'mln'), '0 mln');
    assert.equal(formatCountByUnit(0, 'mlrd'), '0 mlrd');

    assert.equal(formatCountByUnit(314428, 'tam'), '314.428');
    assert.equal(formatCountByUnit(314428, 'min'), '314,43 min');
    assert.equal(formatCountByUnit(314428, 'mln'), '0,31 mln');
    assert.equal(formatCountByUnit(314428, 'mlrd'), '< 0,01 mlrd');

    assert.equal(formatCountByUnit(0.004, 'tam'), '< 0,01');
    assert.equal(formatCountByUnit(500, 'mln'), '< 0,01 mln');
    assert.equal(formatCountByUnit(-500, 'mln'), '> -0,01 mln');
    assert.equal(formatCountByUnit(59, 'mlrd'), '< 0,01 mlrd');

    assert.equal(formatCountByUnit(2543550000, 'tam'), '2.543.550.000');
    assert.equal(formatCountByUnit(2543550000, 'min'), '2.543.550 min');
    assert.equal(formatCountByUnit(2543550000, 'mln'), '2.543,55 mln');
    assert.equal(formatCountByUnit(2543550000, 'mlrd'), '2,54 mlrd');

    assert.equal(formatCountByUnit(-1234567, 'tam'), '-1.234.567');
    assert.equal(formatCountByUnit(-1234567, 'min'), '-1.234,57 min');
    assert.equal(formatCountByUnit(-1234567, 'mln'), '-1,23 mln');
    assert.equal(formatCountByUnit(-1234567, 'mlrd'), '> -0,01 mlrd');
  });

  it('keeps avgAmount (Orta məbləğ) in unscaled AZN across all 4 units', () => {
    const avg = 54195309.27 / 314428;
    const expected = formatAmount(avg, 'tam');
    for (const unit of ALL_UNITS) {
      assert.equal(formatMetricValue(avg, 'avg', unit), expected);
      assert.equal(getMetricUnitTag('avg', unit), ' (₼)');
    }
    assert.equal(formatMetricExactValue(314428, 'count'), '314.428');
    assert.equal(getMetricUnitTag('count', 'mln'), ' (mln)');
    assert.equal(getMetricUnitTag('count', 'tam'), '');
    assert.equal(getMetricUnitTag('amount', 'mln'), ' (mln ₼)');
  });

  it('builds distinct non-overlapping axis ticks scaled to unit', () => {
    for (const unit of ALL_UNITS) {
      const ticks = buildUnitAxisTicks(54195309.27, unit, 5);
      assert.ok(ticks && ticks.length >= 2 && ticks.length <= 5);
      const labels = ticks.map((v) =>
        formatAmount(v, unit, { includeCurrency: false, bareZero: true })
      );
      assert.equal(new Set(labels).size, labels.length);
    }

    const tinyTicks = buildUnitAxisTicks(172.36, 'mlrd', 5);
    assert.deepEqual(tinyTicks, [0, 172.36]);
    assert.deepEqual(
      tinyTicks.map((v) =>
        formatAmount(v, 'mlrd', { includeCurrency: false, bareZero: true })
      ),
      ['0', '< 0,01 mlrd']
    );

    const countTicks = buildCountAxisTicks(314428, 5);
    assert.ok(countTicks && countTicks.length >= 2 && countTicks.length <= 5);
    assert.equal(countTicks[0], 0);

    const scaledCountTicks = buildMetricAxisTicks(314428, 'count', 'min', 5);
    assert.ok(scaledCountTicks && scaledCountTicks.length >= 2 && scaledCountTicks.length <= 5);
    assert.equal(scaledCountTicks[0], 0);
  });
});
