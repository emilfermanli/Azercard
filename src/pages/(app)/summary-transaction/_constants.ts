import type {
  AmountScale,
  SummaryTransactionArgs,
} from '@/types/summary-transaction.type';
import type { GroupKey } from './_types';

// Məbləğ miqyası (AmountScale) — toolbar seqmenti.
export const SCALE_OPTIONS: Array<{ value: AmountScale; label: string; hint: string }> = [
  { value: 1, label: 'Min', hint: 'Manat — tam dəyər' },
  { value: 1_000_000, label: 'Mln', hint: 'Milyon manatla' },
  { value: 1_000_000_000, label: 'Mlrd', hint: 'Milyard manatla' },
];

// Miqyasa uyğun məbləğ vahidi (cell altında).
export const SCALE_UNIT: Record<AmountScale, string> = {
  1: '₼',
  1_000_000: 'mln ₼',
  1_000_000_000: 'mlrd ₼',
};

// ACQUIRING_DEVICE_TYPE — API kodu → ekran etiketi, sabit sıra (slide 1 ardıcıllığı).
export const DEVICE_ORDER: Array<{ code: string; label: string }> = [
  { code: 'POS', label: 'POS' },
  { code: 'ATM', label: 'ATM' },
  { code: 'ECO', label: 'Ecom' },
  { code: 'C2C', label: 'C2C' },
  { code: 'UFX', label: 'UFX' },
];

// 3 qrup sütunu (slide 1) — başlıq, izah (biznes məntiqi), vurğu rəngi.
export const GROUPS: Array<{
  key: GroupKey;
  index: number;
  title: string;
  subtitle: string;
  accent: 'blue' | 'violet' | 'emerald';
}> = [
  {
    key: 'issuing',
    index: 2,
    title: 'Yalnız issuing əməliyyatları',
    subtitle: 'IS_ISSUING = 1 · IS_ACQUIRING = 0',
    accent: 'blue',
  },
  {
    key: 'inner',
    index: 3,
    title: 'Yalnız daxili (inner) əməliyyatlar',
    subtitle: 'IS_ISSUING = 1 · IS_ACQUIRING = 1',
    accent: 'violet',
  },
  {
    key: 'acquiring',
    index: 4,
    title: 'Yalnız acquiring əməliyyatları',
    subtitle: 'IS_ISSUING = 0 · IS_ACQUIRING = 1',
    accent: 'emerald',
  },
];

// --- Drawer filtrləri --- (variant siyahıları CardDashboard/filters-dən təkrar istifadə)
export type SummaryFilterKey =
  | 'targetBank'
  | 'sourceBank'
  | 'cardProductType'
  | 'paymentSystem'
  | 'transGroup'
  | 'operationType'
  | 'tokenStatus'
  | 'isContactless';

type SummaryOptionsKey =
  | 'targetBankNames'
  | 'cardTypeCategories'
  | 'paymentSystems'
  | 'transGroups'
  | 'operationTypes'
  | 'tokenStatuses';

export type SummaryFilterField = {
  key: SummaryFilterKey;
  apiKey: keyof SummaryTransactionArgs;
  /** API filters cavabındakı açar (statik variantlar varsa boş). */
  optionsKey?: SummaryOptionsKey;
  /** API-də variant mənbəyi olmayan sahələr üçün sabit variantlar. */
  staticOptions?: SelectStaticOption[];
  label: string;
  placeholder: string;
};

type SelectStaticOption = { label: string; value: string };

export const FILTER_FIELDS: SummaryFilterField[] = [
  {
    key: 'targetBank',
    apiKey: 'TargetBankName',
    optionsKey: 'targetBankNames',
    label: 'Target bank',
    placeholder: 'Bütün banklar',
  },
  {
    key: 'sourceBank',
    apiKey: 'SourceBankName',
    optionsKey: 'targetBankNames',
    label: 'Source bank',
    placeholder: 'Bütün banklar',
  },
  {
    key: 'cardProductType',
    apiKey: 'CardProductType',
    optionsKey: 'cardTypeCategories',
    label: 'Kart məhsul tipi',
    placeholder: 'Bütün tiplər',
  },
  {
    key: 'paymentSystem',
    apiKey: 'PaymentSystem',
    optionsKey: 'paymentSystems',
    label: 'Ödəniş sistemi',
    placeholder: 'Bütün sistemlər',
  },
  {
    key: 'transGroup',
    apiKey: 'TransGroup',
    optionsKey: 'transGroups',
    label: 'Əməliyyat qrupu',
    placeholder: 'Bütün qruplar',
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
  {
    key: 'isContactless',
    apiKey: 'IsContactless',
    staticOptions: [
      { label: 'Bəli', value: 'true' },
      { label: 'Xeyr', value: 'false' },
    ],
    label: 'Kontaktsız',
    placeholder: 'Hamısı',
  },
];
