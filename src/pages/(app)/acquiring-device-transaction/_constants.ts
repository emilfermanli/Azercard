import type { AcquiringApiFilters } from '@/types/acquiring-device.type';
import type { AmountUnit, Metric } from './_types';

// Kateqoriya parametri — bütün qrafiklərdə hansı göstəricinin əks olunduğunu seçir.
export const METRIC_OPTIONS: Array<{ value: Metric; label: string; monetary: boolean }> = [
  { value: 'turnover', label: 'Dövriyyə', monetary: true },
  { value: 'count', label: 'Əməliyyat sayı', monetary: false },
  { value: 'average', label: 'Ortalama məbləğ', monetary: true },
];

// Kateqoriya → API `Category` dəyəri.
export const METRIC_API_CATEGORY: Record<Metric, string> = {
  turnover: 'Turnover',
  count: 'Count',
  average: 'Average',
};

// Məbləğ vahidi — yalnız monetar göstəricilərə (dövriyyə, ortalama) tətbiq olunur.
export const AMOUNT_UNITS: Array<{ value: AmountUnit; label: string; divisor: number }> = [
  { value: 'Min', label: 'Min (₼)', divisor: 1 },
  { value: 'Mln', label: 'Mln (₼)', divisor: 1_000_000 },
  { value: 'Mlrd', label: 'Mlrd (₼)', divisor: 1_000_000_000 },
];

// Trend qrafikinin zaman addımı.
export const GRANULARITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'Day', label: 'Gün' },
  { value: 'Month', label: 'Ay' },
  { value: 'Quarter', label: 'Rüb' },
  { value: 'Year', label: 'İl' },
];

// Trend total xəttini hesablamaq üçün aqreqasiya ölçüsü (total ölçüdən asılı deyil).
// Qeyd: ACQUIRING_DEVICE_TYPE trend ölçüsü backend-də hələ yoxdur (docs §8).
export const TREND_AGG_DIMENSION = 'trans_group' as const;

export const MONTHS_AZ = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn',
  'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek',
];

// Qurğu tipi → rəng (1-ci slayda uyğun, bütün qrafiklərdə paylaşılır).
export const DEVICE_COLORS: Record<string, string> = {
  POS: '#22c55e',
  ATM: '#00b0f0',
  ECOM: '#ef4444',
  C2C: '#a855f7',
  UFX: '#38bdf8',
};

// Qurğu kartlarının fon qradiyentləri.
export const DEVICE_TONES: Record<string, string> = {
  POS: 'from-emerald-500 to-green-600',
  ATM: 'from-sky-500 to-cyan-500',
  ECOM: 'from-rose-500 to-pink-600',
  C2C: 'from-violet-600 to-fuchsia-600',
  UFX: 'from-sky-400 to-blue-500',
};

// Naməlum dəyərlər (digər qrafiklər) üçün dövr edən palitra.
export const CHART_PALETTE = [
  '#38bdf8',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#ef4444',
  '#6366f1',
  '#14b8a6',
  '#ec4899',
];

// Filter drawer sahələri (11 dropdown — 3-cü slayd).
export type AcquiringFilterKey =
  | 'acquiringDeviceType'
  | 'transGroup'
  | 'operationType'
  | 'tokenStatus'
  | 'mcc'
  | 'acquiringCategory'
  | 'targetBankName'
  | 'sourceBankName'
  | 'targetCity'
  | 'paymentSystem'
  | 'contactlessStatus';

type AcquiringOptionsKey =
  | 'acquiringDeviceTypes'
  | 'transGroups'
  | 'operationTypes'
  | 'tokenStatuses'
  | 'mccs'
  | 'acquiringCategories'
  | 'targetBanks'
  | 'sourceBanks'
  | 'targetCities'
  | 'paymentSystems'
  | 'contactlessStatuses';

export type AcquiringFilterField = {
  key: AcquiringFilterKey;
  apiKey: keyof AcquiringApiFilters;
  optionsKey: AcquiringOptionsKey;
  label: string;
  placeholder: string;
};

export const FILTER_FIELDS: AcquiringFilterField[] = [
  { key: 'acquiringDeviceType', apiKey: 'AcquiringDeviceTypes', optionsKey: 'acquiringDeviceTypes', label: 'Acquiring qurğu', placeholder: 'Bütün qurğular' },
  { key: 'transGroup', apiKey: 'TransGroups', optionsKey: 'transGroups', label: 'Əməliyyat qrupu', placeholder: 'Bütün qruplar' },
  { key: 'operationType', apiKey: 'OperationTypes', optionsKey: 'operationTypes', label: 'Əməliyyat tipi', placeholder: 'Bütün tiplər' },
  { key: 'tokenStatus', apiKey: 'TokenStatuses', optionsKey: 'tokenStatuses', label: 'Token statusu', placeholder: 'Hamısı' },
  { key: 'mcc', apiKey: 'Mccs', optionsKey: 'mccs', label: 'MCC', placeholder: 'Bütün MCC-lər' },
  { key: 'acquiringCategory', apiKey: 'AcquiringCategories', optionsKey: 'acquiringCategories', label: 'Acquiring kateqoriyası', placeholder: 'Bütün kateqoriyalar' },
  { key: 'targetBankName', apiKey: 'TargetBankNames', optionsKey: 'targetBanks', label: 'Target bank', placeholder: 'Bütün banklar' },
  { key: 'sourceBankName', apiKey: 'SourceBankNames', optionsKey: 'sourceBanks', label: 'Source bank', placeholder: 'Bütün banklar' },
  { key: 'targetCity', apiKey: 'TargetCities', optionsKey: 'targetCities', label: 'Target şəhər', placeholder: 'Bütün şəhərlər' },
  { key: 'paymentSystem', apiKey: 'PaymentSystems', optionsKey: 'paymentSystems', label: 'Ödəniş sistemi', placeholder: 'Bütün sistemlər' },
  { key: 'contactlessStatus', apiKey: 'ContactlessStatuses', optionsKey: 'contactlessStatuses', label: 'Kontaktsız', placeholder: 'Hamısı' },
];
