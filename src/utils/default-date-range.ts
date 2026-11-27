import { dateToIso } from './date-format';

export type DefaultDateRange = {
  /** İlk gün (`YYYY-MM-DD`, məs: `2025-11-01`). */
  dateFrom: string;
  /** Son gün (`YYYY-MM-DD`, məs: `2026-10-31`). */
  dateTo: string;
  /** ISO ay başlanğıcı (`YYYY-MM-01T00:00:00`). */
  startMonth: string;
  /** Son tamamlanmış ayın başlanğıcı (`YYYY-MM-01T00:00:00`). */
  endMonth: string;
};

/**
 * Məlumatı olan ən son tamamlanmış ayı (`latestHint`, məs. `2026-10-01T00:00:00`) və ya
 * cari tarixin əvvəlki tamamlanmış ayını əsas götürərək son 12 tam ayın aralığını qaytarır.
 */
export function getLast12CompletedMonthsRange(
  latestHint?: string | null,
  referenceDate: Date = new Date()
): DefaultDateRange {
  let endYear: number;
  let endMonthNum: number;

  const match = latestHint?.trim().match(/^(\d{4})-(\d{2})/);
  if (match) {
    const parsedYear = Number(match[1]);
    const parsedMonth = Number(match[2]);
    if (
      Number.isFinite(parsedYear) &&
      Number.isFinite(parsedMonth) &&
      parsedMonth >= 1 &&
      parsedMonth <= 12
    ) {
      endYear = parsedYear;
      endMonthNum = parsedMonth;
    } else {
      const prev = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
      endYear = prev.getFullYear();
      endMonthNum = prev.getMonth() + 1;
    }
  } else {
    const prev = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
    endYear = prev.getFullYear();
    endMonthNum = prev.getMonth() + 1;
  }

  const startDate = new Date(endYear, endMonthNum - 12, 1);
  const endMonthStart = new Date(endYear, endMonthNum - 1, 1);
  const endMonthLastDay = new Date(endYear, endMonthNum, 0);

  const dateFrom = dateToIso(startDate);
  const dateTo = dateToIso(endMonthLastDay);

  return {
    dateFrom,
    dateTo,
    startMonth: `${dateFrom}T00:00:00`,
    endMonth: `${dateToIso(endMonthStart)}T00:00:00`,
  };
}
