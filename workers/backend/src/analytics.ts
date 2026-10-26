export const RANGES = ["week", "month", "year", "all"] as const;
export type Range = (typeof RANGES)[number];

type TaskRow = { status: string; priority: string; due_date: string | null; created_at: string; updated_at: string };

const DAY_MS = 24 * 60 * 60 * 1000;

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const monthKey = (d: Date) => d.toISOString().slice(0, 7);

function buildBuckets(range: Range, now: Date) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (range === "week" || range === "month") {
    const days = range === "week" ? 7 : 30;
    const starts = Array.from({ length: days }, (_, i) => new Date(today.getTime() - (days - 1 - i) * DAY_MS));
    return { starts, granularity: "day" as const, key: dayKey };
  }
  const starts = Array.from(
    { length: 12 },
    (_, i) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (11 - i), 1)),
  );
  return { starts, granularity: "month" as const, key: monthKey };
}

const count = <T>(items: T[], pick: (t: T) => string) => {
  const out = new Map<string, number>();
  for (const item of items) out.set(pick(item), (out.get(pick(item)) ?? 0) + 1);
  return out;
};

/** Mirrors api/analytics.py in the Django backend (timeline buckets are UTC here). */
export function buildAnalytics(rows: TaskRow[], range: Range, now = new Date()) {
  const { starts, granularity, key } = buildBuckets(range, now);
  const rangeStart = range === "all" ? null : starts[0].getTime();

  // a task counts for the range if it was created or last touched inside it
  const tasks =
    rangeStart === null
      ? rows
      : rows.filter((t) => new Date(t.created_at).getTime() >= rangeStart || new Date(t.updated_at).getTime() >= rangeStart);

  const created = count(tasks, (t) => key(new Date(t.created_at)));
  const completed = count(
    tasks.filter((t) => t.status === "COMPLETED"),
    (t) => key(new Date(t.updated_at)),
  );
  const byStatus = count(tasks, (t) => t.status);
  const byPriority = count(tasks, (t) => t.priority);
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== "COMPLETED").length;
  const total = tasks.length;
  const done = byStatus.get("COMPLETED") ?? 0;

  return {
    range,
    summary: {
      total,
      completed: done,
      in_progress: byStatus.get("IN PROGRESS") ?? 0,
      todo: byStatus.get("TODO") ?? 0,
      blocked: byStatus.get("BLOCKED") ?? 0,
      overdue,
      completion_rate: total ? Math.round((done / total) * 1000) / 10 : 0,
    },
    by_status: ["TODO", "IN PROGRESS", "COMPLETED", "BLOCKED"].map((status) => ({ status, count: byStatus.get(status) ?? 0 })),
    by_priority: ["LOW", "MEDIUM", "HIGH"].map((priority) => ({ priority, count: byPriority.get(priority) ?? 0 })),
    timeline: {
      granularity,
      points: starts.map((s) => {
        const k = key(s);
        return { date: k, created: created.get(k) ?? 0, completed: completed.get(k) ?? 0 };
      }),
    },
  };
}
