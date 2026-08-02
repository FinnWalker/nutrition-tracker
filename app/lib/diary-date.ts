const DIARY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TODAY_DIARY_DATE = "2026-08-02";

function parseDiaryDate(date: string) {
  if (!DIARY_DATE_PATTERN.test(date)) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDiaryDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDiaryDate() {
  return TODAY_DIARY_DATE;
}

export function normalizeDiaryDate(
  input: string | string[] | undefined,
  fallback = getTodayDiaryDate(),
) {
  if (typeof input !== "string") {
    return fallback;
  }

  return parseDiaryDate(input) ? input : fallback;
}

export function addDaysToDiaryDate(date: string, days: number) {
  const parsed =
    parseDiaryDate(date) ?? new Date(`${getTodayDiaryDate()}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return formatDiaryDateInput(parsed);
}

export function formatDiaryDateLabel(date: string) {
  const parsed =
    parseDiaryDate(date) ?? new Date(`${getTodayDiaryDate()}T00:00:00.000Z`);

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}
