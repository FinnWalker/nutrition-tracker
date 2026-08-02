const DEFAULT_GROUPING_WINDOW_MINUTES = 45;
const FALLBACK_CONSUMED_TIME_VALUE = "12:00";

export function getDefaultConsumedAt(entryDate: string, now?: Date) {
  const resolvedNow = now ?? new Date();
  const [year, month, day] = entryDate.split("-").map(Number);

  if (!year || !month || !day) {
    return resolvedNow;
  }

  return new Date(
    year,
    month - 1,
    day,
    resolvedNow.getHours(),
    resolvedNow.getMinutes(),
    resolvedNow.getSeconds(),
    resolvedNow.getMilliseconds(),
  );
}

export function getDefaultConsumedTimeValue(now?: Date) {
  const resolvedNow = now ?? new Date();
  const hours = String(resolvedNow.getHours()).padStart(2, "0");
  const minutes = String(resolvedNow.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function getConsumedAtFromTimeValue(
  entryDate: string,
  timeValue: string,
  fallback?: Date,
) {
  const resolvedFallback = fallback ?? getDefaultConsumedAt(entryDate);
  const [year, month, day] = entryDate.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return resolvedFallback;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function getDiaryTimelineGroupingWindowMinutes() {
  return DEFAULT_GROUPING_WINDOW_MINUTES;
}

export function getFallbackConsumedTimeValue() {
  return FALLBACK_CONSUMED_TIME_VALUE;
}
