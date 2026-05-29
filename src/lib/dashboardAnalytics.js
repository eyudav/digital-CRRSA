import { format, subMonths, startOfMonth, parseISO, isValid } from "date-fns";

const STATUS_ORDER = [
  "submitted",
  "additional_documents_required",
  "approved",
  "scheduled",
  "ready_for_collection",
  "rejected",
];

const STATUS_LABELS = {
  submitted: "Submitted",
  additional_documents_required: "Docs required",
  approved: "Approved",
  scheduled: "Scheduled",
  ready_for_collection: "Ready",
  rejected: "Rejected",
};

/** Monochrome bar fills (light → dark) */
export const MONO_BAR_FILLS = [
  "#e4e4e7",
  "#d4d4d8",
  "#a1a1aa",
  "#71717a",
  "#52525b",
  "#3f3f46",
];

export function buildStatusCounts(apps = []) {
  return STATUS_ORDER.map((key, i) => ({
    key,
    label: STATUS_LABELS[key] || key,
    value: apps.filter((a) => a.status === key).length,
    fill: MONO_BAR_FILLS[i] ?? MONO_BAR_FILLS[MONO_BAR_FILLS.length - 1],
  }));
}

export function buildOutcomeCounts(apps = []) {
  const approved = apps.filter((a) =>
    ["approved", "scheduled", "ready_for_collection"].includes(a.status),
  ).length;
  const rejected = apps.filter((a) => a.status === "rejected").length;
  const inProgress = apps.filter((a) =>
    ["submitted", "additional_documents_required"].includes(a.status),
  ).length;
  return [
    { name: "Approved", value: approved, fill: "#3f3f46" },
    { name: "In progress", value: inProgress, fill: "#a1a1aa" },
    { name: "Rejected", value: rejected, fill: "#d4d4d8" },
  ].filter((d) => d.value > 0);
}

function parseAppDate(app) {
  const raw = app.submittedAt || app.created_at || app.updatedAt;
  if (!raw) return null;
  const d = typeof raw === "string" ? parseISO(raw) : new Date(raw);
  return isValid(d) ? d : null;
}

export function buildMonthlySubmissions(apps = [], monthsBack = 6) {
  const now = new Date();
  return Array.from({ length: monthsBack }, (_, i) => {
    const monthStart = startOfMonth(subMonths(now, monthsBack - 1 - i));
    const monthEnd = startOfMonth(subMonths(monthStart, -1));
    const count = apps.filter((app) => {
      const d = parseAppDate(app);
      return d && d >= monthStart && d < monthEnd;
    }).length;
    return { month: format(monthStart, "MMM"), count };
  });
}
