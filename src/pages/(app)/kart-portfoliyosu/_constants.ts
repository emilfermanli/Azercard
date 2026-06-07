import { Clock, CreditCard, Globe2, Landmark, Package, Tags, Wifi } from 'lucide-react';

import type { CardApiFilters, CardDimension } from '@/types/cards.type';
import type { DimensionTab, RightPanelMode } from './_types';

// Cədvəl/qrafik splitter ölçüləri (px).
export const DEFAULT_CHART_WIDTH = 380;
export const MIN_CHART_WIDTH = 300;
export const STACK_CHART_WIDTH = 260;
export const MIN_TABLE_WIDTH = 520;
export const SPLITTER_SPACE = 28;

// Kart fonu və donut rəng palitraları (dəyər sayı dəyişkən olduğu üçün dövr edir).
export const CARD_TONES = [
  'from-sky-500 to-cyan-500',
  'from-violet-600 to-fuchsia-600',
  'from-emerald-500 to-green-600',
  'from-amber-300 to-yellow-400',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
];
export const PIE_COLORS = [
  '#38bdf8',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#ef4444',
  '#6366f1',
  '#14b8a6',
];

// Sağ panel rejimləri (Pay = donut, Trend = xətti qrafik).
export const RIGHT_PANEL_MODES: Array<{ value: RightPanelMode; label: string }> = [
  { value: 'share', label: 'Pay' },
  { value: 'trend', label: 'Trend' },
];

// Trend qrafiki üçün ay sayı və ay adları.
export const TREND_MONTH_COUNT = 6;
export const MONTHS_AZ = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn',
  'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek',
];

// xy-chart default ölçüləri.
export const XY_DEFAULT_X_DIMENSION: CardDimension = 'payment_scheme';
export const XY_DEFAULT_Y_DIMENSION: CardDimension = 'region_name';

// Donut (pay-chart) üçün default ölçü.
export const PAY_DEFAULT_DIMENSION: CardDimension = 'payment_scheme';

// Filter drawer sahələri (8 dropdown).
export type CardFilterKey =
  | 'bankName'
  | 'regionName'
  | 'paymentScheme'
  | 'productType'
  | 'contactlessStatus'
  | 'expStatus'
  | 'baseCurrency'
  | 'cardProductName';

type CardFilterOptionsKey =
  | 'banks'
  | 'regions'
  | 'paymentSchemes'
  | 'productTypes'
  | 'contactlessStatuses'
  | 'expStatuses'
  | 'currencies'
  | 'cardProducts';

export type CardFilterField = {
  key: CardFilterKey;
  apiKey: keyof CardApiFilters;
  optionsKey: CardFilterOptionsKey;
  label: string;
  placeholder: string;
};

export const FILTER_FIELDS: CardFilterField[] = [
  { key: 'bankName', apiKey: 'BankName', optionsKey: 'banks', label: 'Bank', placeholder: 'Bütün banklar' },
  { key: 'regionName', apiKey: 'RegionName', optionsKey: 'regions', label: 'Region', placeholder: 'Bütün regionlar' },
  { key: 'paymentScheme', apiKey: 'PaymentScheme', optionsKey: 'paymentSchemes', label: 'Ödəniş sistemi', placeholder: 'Bütün sistemlər' },
  { key: 'productType', apiKey: 'ProductType', optionsKey: 'productTypes', label: 'Məhsul tipi', placeholder: 'Bütün tiplər' },
  { key: 'contactlessStatus', apiKey: 'ContactlessStatus', optionsKey: 'contactlessStatuses', label: 'Kontaktsız', placeholder: 'Hamısı' },
  { key: 'expStatus', apiKey: 'ExpStatus', optionsKey: 'expStatuses', label: 'Müddət (EXP)', placeholder: 'Hamısı' },
  { key: 'baseCurrency', apiKey: 'BaseCurrency', optionsKey: 'currencies', label: 'Valyuta', placeholder: 'Bütün valyutalar' },
  { key: 'cardProductName', apiKey: 'CardProductName', optionsKey: 'cardProducts', label: 'Kart məhsulu', placeholder: 'Bütün məhsullar' },
];

// Matris ölçü seçiciləri üçün tablar.
export const DIMENSION_TABS: DimensionTab[] = [
  { label: 'Ödəniş sistemi', value: 'payment_scheme', icon: CreditCard },
  { label: 'Məhsul tipi', value: 'product_type', icon: Tags },
  { label: 'Bank', value: 'bank_name', icon: Landmark },
  { label: 'Region', value: 'region_name', icon: Globe2 },
  { label: 'Kontaktsız', value: 'contactless_status', icon: Wifi },
  { label: 'Müddət (EXP)', value: 'exp_status', icon: Clock },
  { label: 'Kart məhsulu', value: 'card_product_name', icon: Package },
];
