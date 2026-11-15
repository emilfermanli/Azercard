/** Məbləğ formatı (az-AZ, 2 onluq). */
export function formatAmount(value: number): string {
  return Number(value ?? 0).toLocaleString('az-AZ', { maximumFractionDigits: 2 });
}

/** Tam say formatı. */
export function formatInt(value: number): string {
  return Math.round(value ?? 0).toLocaleString('az-AZ');
}

// --- Tema class tokenləri (light/dark) ---

export const panelClass = (isDark: boolean): string =>
  isDark
    ? 'border-slate-800 bg-slate-900/70 text-slate-100 shadow-black/20'
    : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70';

export const mutedText = (isDark: boolean): string =>
  isDark ? 'text-slate-300' : 'text-slate-500';

// Qrup vurğu rəngləri (header lenti + ikon fonu).
type Accent = 'blue' | 'violet' | 'emerald';

export const accentHeader = (accent: Accent, isDark: boolean): string => {
  const map: Record<Accent, string> = {
    blue: isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-700',
    violet: isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-50 text-violet-700',
    emerald: isDark
      ? 'bg-emerald-500/15 text-emerald-300'
      : 'bg-emerald-50 text-emerald-700',
  };
  return map[accent];
};

export const accentBadge = (accent: Accent): string => {
  const map: Record<Accent, string> = {
    blue: 'bg-blue-600 text-white',
    violet: 'bg-violet-600 text-white',
    emerald: 'bg-emerald-600 text-white',
  };
  return map[accent];
};
