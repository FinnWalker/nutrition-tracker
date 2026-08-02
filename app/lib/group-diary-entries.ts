import { getDiaryTimelineGroupingWindowMinutes } from "@/app/lib/diary-consumed-at";

type DiaryEntryLike = {
  id: string;
  consumedAt: string;
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
  startTime: string;
  endTime: string;
  entries: TEntry[];
  subtotal: DiaryGroupTotals;
};

export function groupDiaryEntries<TEntry extends DiaryEntryLike>(
  entries: TEntry[],
  groupingWindowMinutes = getDiaryTimelineGroupingWindowMinutes(),
) {
  const sortedEntries = [...entries].sort(
    (leftEntry, rightEntry) =>
      new Date(leftEntry.consumedAt).getTime() -
      new Date(rightEntry.consumedAt).getTime(),
  );

  const groups: Array<DiaryTimelineGroup<TEntry>> = [];

  for (const entry of sortedEntries) {
    const currentGroup = groups[groups.length - 1];

    if (!currentGroup) {
      groups.push(createTimelineGroup(entry));
      continue;
    }

    const previousEntry = currentGroup.entries[currentGroup.entries.length - 1];
    const gapInMinutes =
      (new Date(entry.consumedAt).getTime() -
        new Date(previousEntry.consumedAt).getTime()) /
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

  return groups;
}

function createTimelineGroup<TEntry extends DiaryEntryLike>(entry: TEntry) {
  return {
    id: entry.id,
    startTime: entry.consumedAt,
    endTime: entry.consumedAt,
    entries: [entry],
    subtotal: {
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    },
  };
}
