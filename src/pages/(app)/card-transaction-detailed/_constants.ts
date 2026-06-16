import type {
  MeasureType,
  TransactionDetailedArgs,
} from '@/types/card-transaction-detailed.type';
import type { ColumnKey, DisplayMode, Measure } from './_types';

// Göstərici: AZN (LOCAL_AMOUNT cəmi) / SAY (əməliyyat sayı).
export const MEASURE_OPTIONS: Array<{ value: Measure; label: string; hint: string }> = [
  { value: 'amount', label: 'AZN', hint: 'Dövriyyə — LOCAL_AMOUNT cəmi (manatla)' },
  { value: 'count', label: 'SAY', hint: 'Əməliyyat sayı' },
];

// Göstərmə: % (faiz nisbəti) / r (mütləq dəyər = rəqəm).
export const DISPLAY_OPTIONS: Array<{ value: DisplayMode; label: string; hint: string }> = [
  { value: 'pct', label: '%', hint: 'Faiz — sütun üzrə pay nisbəti' },
  { value: 'value', label: 'r', hint: 'Rəqəm — mütləq dəyər (məbləğ və ya say)' },
];

// Measure → API MeasureType (faiz hesablama bazası).
export const MEASURE_API: Record<Measure, MeasureType> = {
  amount: 0,
  count: 1,
};

// Kliklənən bölgü sütunları (cross-filter). Hər biri uyğun API filtr açarına yazılır.
export const COLUMNS: Array<{
  key: ColumnKey;
  title: string;
  subtitle: string;
  apiKey: keyof TransactionDetailedArgs;
}> = [
  { key: 'bank', title: 'Bank', subtitle: 'SOURCE_BANK_NAME', apiKey: 'SourceBankName' },
  { key: 'device', title: 'Acquiring qurğu', subtitle: 'ACQUIRING_DEVICE_TYPE', apiKey: 'AcquiringDevice' },
  { key: 'issuing', title: 'İssuing kateqoriya', subtitle: 'IS_ISSUING_CATEGORY', apiKey: 'IssuingCategory' },
  { key: 'targetBank', title: 'Target bank', subtitle: 'TARGET_BANK_NAME', apiKey: 'TargetBankName' },
];

// IS_Issuing_Category izahı (UI alt mətni üçün).
export const ISSUING_HINT =
  'Daxili = On-us · AZC = Domestic AC · Bazar = Domestic Non-AC · Xarici = Foreign';

// Əlavə parametr filtrləri (drawer) — variantları CardDashboard/filters-dən gəlir.
export type TdFilterKey =
  | 'cardType'
  | 'paymentSystem'
  | 'operationType'
  | 'transGroup'
  | 'tokenStatus';

type TdOptionsKey =
  | 'cardTypeCategories'
  | 'paymentSystems'
  | 'operationTypes'
  | 'transGroups'
  | 'tokenStatuses';

export type TdFilterField = {
  key: TdFilterKey;
  apiKey: keyof TransactionDetailedArgs;
  optionsKey: TdOptionsKey;
  label: string;
  placeholder: string;
};

export const FILTER_FIELDS: TdFilterField[] = [
  { key: 'cardType', apiKey: 'CardType', optionsKey: 'cardTypeCategories', label: 'Kart tipi', placeholder: 'Bütün tiplər' },
  { key: 'paymentSystem', apiKey: 'PaymentSystem', optionsKey: 'paymentSystems', label: 'Ödəniş sistemi', placeholder: 'Bütün sistemlər' },
  { key: 'operationType', apiKey: 'OperationType', optionsKey: 'operationTypes', label: 'Əməliyyat tipi', placeholder: 'Bütün tiplər' },
  { key: 'transGroup', apiKey: 'TransGroup', optionsKey: 'transGroups', label: 'Əməliyyat qrupu', placeholder: 'Bütün qruplar' },
  { key: 'tokenStatus', apiKey: 'TokenStatus', optionsKey: 'tokenStatuses', label: 'Token statusu', placeholder: 'Hamısı' },
];
