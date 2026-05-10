import { SERVICES } from "@/data/seed";
import { apiStatusToUi } from "@/lib/statusMap";

function feeForServiceName(name) {
  const s = SERVICES.find((x) => x.name === name || x.slug === name);
  return s?.fee ?? 0;
}

function refFromRow(row) {
  const t = row.created_at || row.createdAt;
  const year = t ? new Date(t).getFullYear() : new Date().getFullYear();
  const id = row.id;
  return `CRC-${year}-${String(id).padStart(6, "0")}`;
}

function formatPgTime(t) {
  if (!t) return "";
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/** GET /api/applications/my row */
export function mapApplicationListRow(row, citizenName = "") {
  let appointment = null;
  if (row.appt_queue_number != null && row.appt_office_code) {
    const rawDate = row.appt_slot_date;
    const dateStr =
      rawDate instanceof Date
        ? rawDate.toISOString().slice(0, 10)
        : String(rawDate || "").slice(0, 10);
    const start = formatPgTime(row.appt_start_time);
    const end = formatPgTime(row.appt_end_time);
    appointment = {
      id: `ap-${row.id}`,
      applicationId: String(row.id),
      office: row.appt_office_code,
      date: dateStr,
      timeSlot: end ? `${start} – ${end}` : start,
      queueNumber: row.appt_queue_number,
      status: "scheduled",
    };
  }
  return {
    id: String(row.id),
    refNumber: refFromRow(row),
    citizenId: String(row.citizen_id),
    citizenName,
    serviceId: "",
    serviceName: row.service_type,
    status: apiStatusToUi(row.status),
    formData: row.form_data || {},
    documents: [],
    timeline: [],
    submittedAt: row.created_at,
    updatedAt: row.updated_at,
    fee: feeForServiceName(row.service_type),
    appointment,
  };
}

/** GET /api/records/search row */
export function mapStaffSearchRow(row) {
  return {
    id: String(row.id),
    refNumber: refFromRow(row),
    citizenId: "",
    citizenName: row.citizen_name || "",
    serviceId: "",
    serviceName: row.service_type,
    status: apiStatusToUi(row.status),
    formData: {},
    documents: [],
    timeline: [],
    submittedAt: row.created_at,
    updatedAt: row.created_at,
    fee: feeForServiceName(row.service_type),
    appointment: null,
  };
}

/** GET /api/applications/:id */
export function mapApplicationDetail(payload) {
  const app = payload.application;
  const fee = feeForServiceName(app.service_type);
  const refNumber = refFromRow(app);

  const timeline = (payload.history || []).map((h) => ({
    id: `h-${h.id}`,
    status: apiStatusToUi(h.status),
    message: h.comment || `${h.status}`,
    at: h.changed_at,
    by: h.changed_by_name || "System",
  }));

  if (!timeline.length) {
    timeline.push({
      id: "t-initial",
      status: "submitted",
      message: "Application submitted",
      at: app.created_at,
      by: "Citizen",
    });
  }

  const documents = (payload.documents || []).map((d) => ({
    id: String(d.id),
    applicationId: String(app.id),
    name: d.file_name,
    fileType: d.mime_type,
    sizeKb: Math.max(1, Math.round(Number(d.file_size) / 1024)),
    uploadedAt: d.created_at,
    verified: Boolean(d.verified),
  }));

  let appointment = null;
  if (payload.appointment) {
    const a = payload.appointment;
    const rawDate = a.slot_date;
    const dateStr =
      rawDate instanceof Date
        ? rawDate.toISOString().slice(0, 10)
        : String(rawDate).slice(0, 10);
    const start = formatPgTime(a.start_time);
    const end = formatPgTime(a.end_time);
    appointment = {
      id: String(a.id),
      applicationId: String(app.id),
      office: a.office_code,
      date: dateStr,
      timeSlot: end ? `${start} – ${end}` : start,
      queueNumber: a.queue_number,
      status: (a.appointment_status || "Scheduled").toLowerCase(),
    };
  }

  return {
    id: String(app.id),
    refNumber,
    citizenId: String(app.citizen_id),
    citizenName: app.citizen_full_name || "",
    serviceId: "",
    serviceName: app.service_type,
    status: apiStatusToUi(app.status),
    formData: app.form_data || {},
    documents,
    timeline,
    appointment,
    submittedAt: app.created_at,
    updatedAt: app.updated_at,
    fee,
  };
}

export function slotLabel(slot) {
  const start = formatPgTime(slot.start_time);
  const end = formatPgTime(slot.end_time);
  return end ? `${start} – ${end}` : start;
}
