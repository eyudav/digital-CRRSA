/**
 * Lightweight in-memory + localStorage data store.
 * This is the single seam to replace with a real backend (Express/Postgres
 * or another cloud backend) - every page reads/writes through this module.
 */
import { SEED_APPLICATIONS, SEED_ANNOUNCEMENTS, SEED_NOTIFICATIONS, SEED_COMPLAINTS, SEED_CERTIFICATES, SEED_USERS } from "./seed";
const KEY = "crrsa-store-v2";
function load() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw)
            return JSON.parse(raw);
    }
    catch { }
    const initial = {
        users: SEED_USERS,
        applications: SEED_APPLICATIONS,
        announcements: SEED_ANNOUNCEMENTS,
        notifications: SEED_NOTIFICATIONS,
        complaints: SEED_COMPLAINTS,
        certificates: SEED_CERTIFICATES,
    };
    localStorage.setItem(KEY, JSON.stringify(initial));
    return initial;
}
function save(s) {
    localStorage.setItem(KEY, JSON.stringify(s));
    listeners.forEach((l) => l());
}
const listeners = new Set();
export function subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
}
export const store = {
    all: () => load(),
    // ---- Users
    upsertUser(u) {
        const s = load();
        const idx = s.users.findIndex((x) => x.id === u.id);
        if (idx >= 0)
            s.users[idx] = u;
        else
            s.users.push(u);
        save(s);
    },
    findUserByEmail(email) {
        return load().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    },
    // ---- Applications
    applicationsForCitizen(citizenId) {
        return load().applications.filter((a) => a.citizenId === citizenId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    allApplications() {
        return load().applications.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    applicationById(id) {
        return load().applications.find((a) => a.id === id);
    },
    createApplication(a) {
        const s = load();
        s.applications.unshift(a);
        save(s);
    },
    updateApplication(id, patch) {
        const s = load();
        const idx = s.applications.findIndex((a) => a.id === id);
        if (idx < 0)
            return;
        s.applications[idx] = { ...s.applications[idx], ...patch, updatedAt: new Date().toISOString() };
        save(s);
    },
    addTimeline(id, entry, statusUpdate) {
        const s = load();
        const idx = s.applications.findIndex((a) => a.id === id);
        if (idx < 0)
            return;
        const app = s.applications[idx];
        app.timeline = [...app.timeline, entry];
        if (statusUpdate)
            app.status = statusUpdate;
        app.updatedAt = new Date().toISOString();
        s.applications[idx] = app;
        save(s);
    },
    addDocument(applicationId, doc) {
        const s = load();
        const idx = s.applications.findIndex((a) => a.id === applicationId);
        if (idx < 0)
            return;
        s.applications[idx].documents.push(doc);
        s.applications[idx].updatedAt = new Date().toISOString();
        save(s);
    },
    setAppointment(applicationId, appointment) {
        const s = load();
        const idx = s.applications.findIndex((a) => a.id === applicationId);
        if (idx < 0)
            return;
        s.applications[idx].appointment = appointment;
        s.applications[idx].updatedAt = new Date().toISOString();
        save(s);
    },
    verifyDocument(applicationId, docId, verified) {
        const s = load();
        const app = s.applications.find((a) => a.id === applicationId);
        if (!app)
            return;
        const d = app.documents.find((x) => x.id === docId);
        if (!d)
            return;
        d.verified = verified;
        app.updatedAt = new Date().toISOString();
        save(s);
    },
    // ---- Announcements
    announcements: () => load().announcements.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    createAnnouncement(a) {
        const s = load();
        s.announcements.unshift(a);
        save(s);
    },
    // ---- Notifications
    notificationsFor(userId) {
        return load().notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    pushNotification(n) {
        const s = load();
        s.notifications.unshift(n);
        save(s);
    },
    markAllRead(userId) {
        const s = load();
        s.notifications = s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n));
        save(s);
    },
    // ---- Complaints
    complaintsFor(citizenId) {
        return load().complaints.filter((c) => c.citizenId === citizenId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    allComplaints() {
        return load().complaints.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    createComplaint(c) {
        const s = load();
        s.complaints.unshift(c);
        save(s);
    },
    // ---- Certificates
    certificatesFor(citizenId) {
        const s = load();
        const myAppIds = s.applications.filter((a) => a.citizenId === citizenId).map((a) => a.id);
        return s.certificates.filter((c) => myAppIds.includes(c.applicationId));
    },
};
export function uid(prefix = "id") {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36).slice(-4)}`;
}
