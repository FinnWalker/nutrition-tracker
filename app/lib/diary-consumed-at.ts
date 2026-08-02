const DEFAULT_GROUPING_WINDOW_MINUTES = 45;

export function getDefaultConsumedAt(entryDate: string, now = new Date()) {
  const [year, month, day] = entryDate.split("-").map(Number);

  if (!year || !month || !day) {
    return now;
  }

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds(),
    ),
  );
}

export function getDefaultConsumedTimeValue(now = new Date()) {
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function getConsumedAtFromTimeValue(
  entryDate: string,
  timeValue: string,
  fallback = getDefaultConsumedAt(entryDate),
) {
  const [year, month, day] = entryDate.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return fallback;
  }

  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
}

export function getDiaryTimelineGroupingWindowMinutes() {
  return DEFAULT_GROUPING_WINDOW_MINUTES;
}
