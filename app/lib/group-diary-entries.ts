import { getDiaryTimelineGroupingWindowMinutes } from "@/app/lib/diary-consumed-at";

type DiaryEntryLike = {
  id: string;
  consumedAt: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type DiaryGroupTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DiaryTimelineGroup<TEntry extends DiaryEntryLike> = {
  id: string;
  startTime: string | null;
  endTime: string | null;
  isAnyTime: boolean;
  entries: TEntry[];
  subtotal: DiaryGroupTotals;
};

export function groupDiaryEntries<TEntry extends DiaryEntryLike>(
  entries: TEntry[],
  groupingWindowMinutes = getDiaryTimelineGroupingWindowMinutes(),
) {
  const timedEntries = entries
    .filter((entry) => entry.consumedAt)
    .sort(
      (leftEntry, rightEntry) =>
        new Date(leftEntry.consumedAt ?? 0).getTime() -
        new Date(rightEntry.consumedAt ?? 0).getTime(),
    );
  const anyTimeEntries = entries.filter((entry) => !entry.consumedAt);

  const groups: Array<DiaryTimelineGroup<TEntry>> = [];

  for (const entry of timedEntries) {
    const currentGroup = groups[groups.length - 1];

    if (!currentGroup) {
      groups.push(createTimelineGroup(entry));
      continue;
    }

    const previousEntry = currentGroup.entries[currentGroup.entries.length - 1];
    const gapInMinutes =
      (new Date(entry.consumedAt!).getTime() -
        new Date(previousEntry.consumedAt!).getTime()) /
      60000;

    if (gapInMinutes <= groupingWindowMinutes) {
      currentGroup.entries.push(entry);
      currentGroup.endTime = entry.consumedAt;
      currentGroup.subtotal.calories += entry.calories;
      currentGroup.subtotal.protein += entry.protein;
      currentGroup.subtotal.carbs += entry.carbs;
      currentGroup.subtotal.fat += entry.fat;
      continue;
    }

    groups.push(createTimelineGroup(entry));
  }

  if (anyTimeEntries.length > 0) {
    groups.push(createAnyTimeGroup(anyTimeEntries));
  }

  return groups;
}

function createTimelineGroup<TEntry extends DiaryEntryLike>(entry: TEntry) {
  return {
    id: entry.id,
    startTime: entry.consumedAt,
    endTime: entry.consumedAt,
    isAnyTime: false,
    entries: [entry],
    subtotal: {
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    },
  };
}

function createAnyTimeGroup<TEntry extends DiaryEntryLike>(entries: TEntry[]) {
  return {
    id: `any-time-${entries.map((entry) => entry.id).join("-")}`,
    startTime: null,
    endTime: null,
    isAnyTime: true,
    entries,
    subtotal: entries.reduce(
      (runningTotals, entry) => ({
        calories: runningTotals.calories + entry.calories,
        protein: runningTotals.protein + entry.protein,
        carbs: runningTotals.carbs + entry.carbs,
        fat: runningTotals.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    ),
  };
}
