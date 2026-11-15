import type {
  CardDashboardArgs,
  CardDashboardResponse,
} from '@/types/card-dashboard.type';
import type { Metric } from './_types';

// Yuxarı 4 KPI pəncərəsi — kliklə aktiv göstərici seçilir (trend + bölgüləri idarə edir).
export const KPI_METRICS: Array<{
  key: Metric;
  label: string;
  kpiField: keyof import('@/types/card-dashboard.type').CardKpi;
  monetary: boolean;
}> = [
  { key: 'amount', label: 'Ümumi dövriyyə', kpiField: 'totalAmount', monetary: true },
  { key: 'count', label: 'Əməliyyat sayı', kpiField: 'totalTxCount', monetary: false },
  { key: 'avg', label: 'Orta məbləğ', kpiField: 'avgAmount', monetary: true },
  { key: 'max', label: 'Maksimum ödəniş', kpiField: 'maxAmount', monetary: true },
];

// Trend zaman addımı (DateGrouping enum).
export const DATE_GROUPING_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Ay' },
  { value: 1, label: 'Rüb' },
  { value: 2, label: 'İl' },
];

// Məbləğ yuvarlaqlaşdırma (RoundTo enum) — server tərəfdə tətbiq olunur.
export const ROUND_TO_OPTIONS: Array<{ value: number; label: string; suffix: string }> = [
  { value: 0, label: 'Tam', suffix: '' },
  { value: 1, label: 'Min', suffix: 'min' },
  { value: 2, label: 'Mln', suffix: 'mln' },
  { value: 3, label: 'Mlrd', suffix: 'mlrd' },
];

// Bölgü qrafiklərinin (6,7,8,9) donut palitrası.
export const DONUT_PALETTE = [
  '#3b82f6',
  '#10b981',
  '#06b6d4',
  '#f59e0b',
  '#a855f7',
  '#ef4444',
  '#6366f1',
  '#ec4899',
];

// |dəyişmə %| bu həddi keçəndə trenddə alert göstərilir.
export const ALERT_THRESHOLD_PCT = 20;

// Bölgü qrafikləri (6,7,8,9).
export const BREAKDOWN_CHARTS: Array<{
  key: keyof Pick<
    CardDashboardResponse,
    'productBreakdown' | 'paymentSystem' | 'paymentType' | 'cashNonCash'
  >;
  title: string;
  subtitle: string;
}> = [
  {
    key: 'productBreakdown',
    title: 'Kart məhsul tipi',
    subtitle: 'CARD_PRODUCT_TYPE_CATEGORY üzrə',
  },
  { key: 'paymentSystem', title: 'Ödəniş sistemi', subtitle: 'PAYMENT_SYSTEM üzrə' },
  {
    key: 'paymentType',
    title: 'Ödəniş tipi (On-us / Off-us)',
    subtitle: 'IS_ISSUING_CATEGORY üzrə',
  },
  { key: 'cashNonCash', title: 'Cash / Non-cash', subtitle: 'OPERATION_TYPE üzrə' },
];

// Filter drawer sahələri (tək seçimli — API tək string parametr gözləyir).
export type CardDashFilterKey =
  | 'targetBankName'
  | 'transGroup'
  | 'cardTypeCategory'
  | 'paymentSystem'
  | 'paymentType'
  | 'operationType'
  | 'tokenStatus';

type CardDashOptionsKey =
  | 'targetBankNames'
  | 'transGroups'
  | 'cardTypeCategories'
  | 'paymentSystems'
  | 'paymentTypes'
  | 'operationTypes'
  | 'tokenStatuses';

export type CardDashFilterField = {
  key: CardDashFilterKey;
  apiKey: keyof CardDashboardArgs;
  optionsKey: CardDashOptionsKey;
  label: string;
  placeholder: string;
};

export const FILTER_FIELDS: CardDashFilterField[] = [
  {
    key: 'targetBankName',
    apiKey: 'TargetBankName',
    optionsKey: 'targetBankNames',
    label: 'Target bank',
    placeholder: 'Bütün banklar',
  },
  {
    key: 'transGroup',
    apiKey: 'TransGroup',
    optionsKey: 'transGroups',
    label: 'Əməliyyat qrupu',
    placeholder: 'Bütün qruplar',
  },
  {
    key: 'cardTypeCategory',
    apiKey: 'CardTypeCategory',
    optionsKey: 'cardTypeCategories',
    label: 'Kart tipi kateqoriyası',
    placeholder: 'Bütün kateqoriyalar',
  },
  {
    key: 'paymentSystem',
    apiKey: 'PaymentSystem',
    optionsKey: 'paymentSystems',
    label: 'Ödəniş sistemi',
    placeholder: 'Bütün sistemlər',
  },
  {
    key: 'paymentType',
    apiKey: 'PaymentType',
    optionsKey: 'paymentTypes',
    label: 'Ödəniş tipi',
    placeholder: 'Bütün tiplər',
  },
  {
    key: 'operationType',
    apiKey: 'OperationType',
    optionsKey: 'operationTypes',
    label: 'Əməliyyat tipi',
    placeholder: 'Bütün tiplər',
  },
  {
    key: 'tokenStatus',
    apiKey: 'TokenStatus',
    optionsKey: 'tokenStatuses',
    label: 'Token statusu',
    placeholder: 'Hamısı',
  },
];

// IsContactless üçün 3 vəziyyətli seçim.
export const CONTACTLESS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Hamısı' },
  { value: 'true', label: 'Bəli' },
  { value: 'false', label: 'Xeyr' },
];
