/** Backend application status (Title Case) ↔ UI keys used by StatusBadge */
const API_TO_UI = {
  Submitted: "submitted",
  "Additional Documents Required": "additional_documents_required",
  Approved: "approved",
  Scheduled: "scheduled",
  Rejected: "rejected",
  "Ready for Collection": "ready_for_collection",
  // 'Completed' removed: final state is 'Ready for Collection'
};

const UI_TO_API = Object.fromEntries(
  Object.entries(API_TO_UI).map(([a, b]) => [b, a]),
);

export function apiStatusToUi(status) {
  if (!status) return "submitted";
  return API_TO_UI[status] || "submitted";
}

export function uiStatusToApi(status) {
  return UI_TO_API[status] || status;
}

const COMPLAINT_API_TO_UI = {
  Open: "pending",
  "In Progress": "in_progress",
  Resolved: "resolved",
};

const COMPLAINT_UI_TO_API = {
  pending: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export function complaintApiToUi(status) {
  return COMPLAINT_API_TO_UI[status] || "pending";
}

export function complaintUiToApi(status) {
  return COMPLAINT_UI_TO_API[status] || status;
}
