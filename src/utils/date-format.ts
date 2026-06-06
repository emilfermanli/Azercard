/** "YYYY-MM-DD" və ya ISO datetime → "DD.MM.YYYY" (Azərbaycan UI formatı). */
export function formatDateInputDisplay(value: string): string {
  if (!value) return '';
  const datePart = value.length >= 10 ? value.slice(0, 10) : value;
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return '';
  return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
}

/** Cədvəl və mətn göstərişi üçün tarix formatı. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const formatted = formatDateInputDisplay(value);
  return formatted || '-';
}

export function isoToDate(iso: string): Date | undefined {
  const datePart = iso?.slice(0, 10);
  if (!datePart) return undefined;
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function dateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
  return dateToIso(new Date());
}
