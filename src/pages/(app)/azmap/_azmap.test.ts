import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { AzmapItem } from '@/types/azmap.type';
import { formatCountByUnit, type AmountUnit } from '@/utils/amount-unit';
import {
  BAKI_DEFAULT_LATITUDE,
  BAKI_DEFAULT_LONGITUDE,
  buildCityPoints,
  formatMetricValue,
  getCityName,
  hasCoordinates,
} from './index';

const ALL_UNITS: AmountUnit[] = ['tam', 'min', 'mln', 'mlrd'];

function makeItem(overrides: Partial<AzmapItem>): AzmapItem {
  return {
    reportMonth: '2026-10-01T00:00:00',
    bankName: 'ABB',
    sourceCity: 'BAKI',
    sourceCityClean: 'BAKI',
    sourceCityCategory: 'BAKI',
    totalAmount: 100,
    totalCount: 1,
    latitude: BAKI_DEFAULT_LATITUDE,
    longitude: BAKI_DEFAULT_LONGITUDE,
    ...overrides,
  };
}

describe('AzMap city fallback and point aggregation', () => {
  it('assigns null, empty, whitespace, NAMƏLUM, DIGER, OTHER, UNKNOWN, or missing coordinates to BAKI', () => {
    const unknownCases: AzmapItem[] = [
      makeItem({ latitude: null, longitude: null, sourceCity: 'UNMATCHED_XYZ', sourceCityClean: 'UNMATCHED_XYZ' }),
      makeItem({ sourceCity: '', sourceCityClean: '' }),
      makeItem({ sourceCity: '   ', sourceCityClean: '   ' }),
      makeItem({ sourceCity: 'NAMƏLUM', sourceCityClean: 'NAMƏLUM' }),
      makeItem({ sourceCity: 'namelum', sourceCityClean: 'namelum' }),
      makeItem({ sourceCity: 'DIGER', sourceCityClean: 'DIGER' }),
      makeItem({ sourceCity: 'DİGƏR', sourceCityClean: 'DİGƏR' }),
      makeItem({ sourceCity: 'OTHER', sourceCityClean: 'OTHER' }),
      makeItem({ sourceCity: 'UNKNOWN', sourceCityClean: 'UNKNOWN' }),
    ];

    for (const item of unknownCases) {
      assert.equal(getCityName(item), 'BAKI');
    }
  });

  it('never drops rows without coordinates and merges them into BAKI with BAKI coordinates', () => {
    const items: AzmapItem[] = [
      makeItem({
        bankName: 'ABB',
        sourceCity: 'BAKI',
        sourceCityClean: 'BAKI',
        sourceCityCategory: 'BAKI',
        totalAmount: 1_000_000,
        totalCount: 10_000,
        latitude: BAKI_DEFAULT_LATITUDE,
        longitude: BAKI_DEFAULT_LONGITUDE,
      }),
      makeItem({
        bankName: 'KAPITAL',
        sourceCity: 'NAMƏLUM',
        sourceCityClean: 'NAMƏLUM',
        sourceCityCategory: 'REGION',
        totalAmount: 250_000,
        totalCount: 2_500,
        latitude: null,
        longitude: null,
      }),
      makeItem({
        bankName: 'PASHA',
        sourceCity: 'DIGER',
        sourceCityClean: 'DIGER',
        sourceCityCategory: 'REGION',
        totalAmount: 50_000,
        totalCount: 500,
        latitude: BAKI_DEFAULT_LATITUDE,
        longitude: BAKI_DEFAULT_LONGITUDE,
      }),
      makeItem({
        bankName: 'ABB',
        sourceCity: 'QOBUSTAN',
        sourceCityClean: 'QOBUSTAN',
        sourceCityCategory: 'REGION',
        totalAmount: 300_000,
        totalCount: 3_000,
        latitude: 40.533333,
        longitude: 48.92,
      }),
      makeItem({
        bankName: 'ABB',
        sourceCity: 'ABSERON',
        sourceCityClean: 'ABSERON',
        sourceCityCategory: 'REGION',
        totalAmount: 400_000,
        totalCount: 4_000,
        latitude: 40.4539,
        longitude: 49.7383,
      }),
    ];

    assert.equal(hasCoordinates(items[0]), true);
    assert.equal(hasCoordinates(items[1]), false);

    const points = buildCityPoints(items);
    assert.equal(points.length, 3);

    const sumPointsAmount = points.reduce((acc, p) => acc + p.totalAmount, 0);
    const sumItemsAmount = items.reduce((acc, i) => acc + i.totalAmount, 0);
    assert.equal(sumPointsAmount, sumItemsAmount);

    const baki = points.find((p) => p.city === 'BAKI');
    assert.ok(baki);
    assert.equal(baki.totalAmount, 1_300_000);
    assert.equal(baki.totalCount, 13_000);
    assert.equal(baki.bankCount, 3);
    assert.equal(baki.category, 'BAKI');
    assert.deepEqual(baki.position, [BAKI_DEFAULT_LONGITUDE, BAKI_DEFAULT_LATITUDE]);

    const qobustan = points.find((p) => p.city === 'QOBUSTAN');
    assert.ok(qobustan);
    assert.equal(qobustan.totalAmount, 300_000);
    assert.deepEqual(qobustan.position, [48.92, 40.533333]);

    const abseron = points.find((p) => p.city === 'ABSERON');
    assert.ok(abseron);
    assert.equal(abseron.totalAmount, 400_000);
    assert.deepEqual(abseron.position, [49.7383, 40.4539]);
  });

  it('scales transaction counts across all 4 units while keeping average ticket in AZN', () => {
    const count = 314428;
    assert.equal(formatMetricValue(count, 'count', 'tam'), '314.428');
    assert.equal(formatMetricValue(count, 'count', 'min'), '314,43 min');
    assert.equal(formatMetricValue(count, 'count', 'mln'), '0,31 mln');
    assert.equal(formatMetricValue(count, 'count', 'mlrd'), '< 0,01 mlrd');

    for (const unit of ALL_UNITS) {
      assert.doesNotMatch(formatMetricValue(count, 'count', unit), /₼/);
      assert.equal(formatMetricValue(54.32, 'average', unit), '54,32 ₼');
    }

    assert.equal(formatCountByUnit(0, 'mln'), '0 mln');
    assert.equal(formatCountByUnit(null, 'mln'), '—');
    assert.equal(formatCountByUnit(500, 'mln'), '< 0,01 mln');
    assert.equal(formatCountByUnit(2543550000, 'mlrd'), '2,54 mlrd');
  });
});
