export const APP_LOCALE = 'az-AZ';

export type AmountUnit = 'tam' | 'min' | 'mln' | 'mlrd';

export type AmountUnitConfig = {
  value: AmountUnit;
  label: string;
  suffix: string;
  divisor: number;
};

export const AMOUNT_UNIT_CONFIG: Record<AmountUnit, AmountUnitConfig> = {
  tam: { value: 'tam', label: 'Tam', suffix: '', divisor: 1 },
  min: { value: 'min', label: 'Min', suffix: 'min', divisor: 1e3 },
  mln: { value: 'mln', label: 'Mln', suffix: 'mln', divisor: 1e6 },
  mlrd: { value: 'mlrd', label: 'Mlrd', suffix: 'mlrd', divisor: 1e9 },
};

export const AMOUNT_UNIT_OPTIONS: AmountUnitConfig[] = [
  AMOUNT_UNIT_CONFIG.tam,
  AMOUNT_UNIT_CONFIG.min,
  AMOUNT_UNIT_CONFIG.mln,
  AMOUNT_UNIT_CONFIG.mlrd,
];

export function isAmountUnit(value: unknown): value is AmountUnit {
  return value === 'tam' || value === 'min' || value === 'mln' || value === 'mlrd';
}

export function getUnitDivisor(unit: AmountUnit): number {
  return AMOUNT_UNIT_CONFIG[unit].divisor;
}

export function getUnitSuffix(unit: AmountUnit): string {
  return AMOUNT_UNIT_CONFIG[unit].suffix;
}

export type FormatAmountOptions = {
  includeCurrency?: boolean;
  maxFractionDigits?: number;
  exact?: boolean;
  bareZero?: boolean;
};

function normalizeZero(value: number): number {
  return Object.is(value, -0) || value === 0 ? 0 : value;
}

function isValidFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Xam AZN məbləğini seçilmiş vahidə (Tam / Min / Mln / Mlrd) bölüb
 * layihə standartı (`az-AZ`) ilə formatlayır.
 * Sıfırdan fərqli dəyər heç vaxt "0" kimi göstərilmir.
 */
export function formatAmount(
  rawAzn: number | null | undefined,
  unit: AmountUnit,
  options?: FormatAmountOptions
): string {
  if (!isValidFiniteNumber(rawAzn)) return '—';

  const normalized = normalizeZero(rawAzn);
  const includeCurrency = options?.includeCurrency ?? true;
  const maxFractionDigits = options?.maxFractionDigits ?? 2;
  const exact = options?.exact ?? false;
  const bareZero = options?.bareZero ?? false;
  const currency = includeCurrency ? ' ₼' : '';

  if (exact) {
    if (normalized === 0) {
      return bareZero ? '0' : `0${currency}`;
    }
    const abs = Math.abs(normalized);
    if (abs < 0.01) {
      const digits = Math.min(12, Math.max(2, -Math.floor(Math.log10(abs)) + 2));
      const formatted = new Intl.NumberFormat(APP_LOCALE, {
        maximumFractionDigits: digits,
      }).format(normalized);
      return `${formatted}${currency}`;
    }
    const formatted = new Intl.NumberFormat(APP_LOCALE, {
      maximumFractionDigits: 2,
    }).format(normalized);
    return `${formatted}${currency}`;
  }

  const { divisor, suffix } = AMOUNT_UNIT_CONFIG[unit];
  const unitPart = suffix ? ` ${suffix}` : '';

  if (normalized === 0) {
    return bareZero ? '0' : `0${unitPart}${currency}`;
  }

  const scaled = normalized / divisor;
  const threshold = Math.pow(10, -maxFractionDigits);

  if (Math.abs(scaled) < threshold) {
    const minLabel = new Intl.NumberFormat(APP_LOCALE, {
      minimumFractionDigits: maxFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    }).format(threshold);
    return scaled > 0
      ? `< ${minLabel}${unitPart}${currency}`
      : `> -${minLabel}${unitPart}${currency}`;
  }

  const formatted = new Intl.NumberFormat(APP_LOCALE, {
    maximumFractionDigits: maxFractionDigits,
  }).format(scaled);
  return `${formatted}${unitPart}${currency}`;
}

/** Tooltip və detallı yoxlama üçün tam AZN dəyəri (sıfırdan fərqli kiçik dəyərləri gizlətmir). */
export function formatExactAmount(rawAzn: number | null | undefined): string {
  return formatAmount(rawAzn, 'tam', { exact: true });
}

/** Əməliyyat sayı formatı — vahiddən asılı deyil və sonluq ("min/mln/mlrd/₼") əlavə etmir. */
export function formatCount(value: number | null | undefined): string {
  if (!isValidFiniteNumber(value)) return '—';
  const rounded = Math.round(value);
  const normalized = normalizeZero(rounded);
  return new Intl.NumberFormat(APP_LOCALE, {
    maximumFractionDigits: 0,
  }).format(normalized);
}

/** Faiz formatı (`az-AZ`). */
export function formatPct(value: number | null | undefined): string {
  if (!isValidFiniteNumber(value)) return '—';
  const normalized = normalizeZero(value);
  return `${new Intl.NumberFormat(APP_LOCALE, {
    maximumFractionDigits: 1,
  }).format(normalized)}%`;
}

function buildNiceAxisTicks(
  maxScaled: number,
  divisor: number,
  minStep: number,
  maxTicks: number
): number[] {
  const targetIntervals = Math.max(1, maxTicks - 1);
  const rawStep = Math.max(minStep, maxScaled / targetIntervals);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const multipliers = magnitude < 0.1 ? [1, 2, 5, 10, 20] : [1, 2, 2.5, 5, 10, 20];

  let step = Math.max(minStep, 10 * magnitude);
  for (const m of multipliers) {
    const candidate = Math.max(minStep, m * magnitude);
    if (candidate >= rawStep && Math.ceil(maxScaled / candidate) + 1 <= maxTicks) {
      step = candidate;
      break;
    }
  }

  const topStepCount = Math.max(1, Math.ceil(maxScaled / step));
  const ticks: number[] = [];
  for (let i = 0; i <= topStepCount; i++) {
    const scaledTick = Number((i * step).toFixed(10));
    ticks.push(scaledTick * divisor);
  }
  return ticks;
}

/** Seçilmiş məbləğ vahidinə uyğun təmiz, üst-üstə düşməyən ox tick-ləri (xam AZN-də qaytarılır). */
export function buildUnitAxisTicks(
  maxRaw: number,
  unit: AmountUnit,
  maxTicks = 5
): number[] | undefined {
  if (!Number.isFinite(maxRaw) || maxRaw <= 0) return undefined;
  const divisor = getUnitDivisor(unit);
  const scaledMax = maxRaw / divisor;
  if (scaledMax < 0.01) {
    return [0, maxRaw];
  }
  return buildNiceAxisTicks(scaledMax, divisor, 0.01, maxTicks);
}

/** Əməliyyat sayı qrafikləri üçün təmiz tam ox tick-ləri. */
export function buildCountAxisTicks(
  maxRaw: number,
  maxTicks = 5
): number[] | undefined {
  if (!Number.isFinite(maxRaw) || maxRaw <= 0) return undefined;
  return buildNiceAxisTicks(maxRaw, 1, 1, maxTicks);
}
