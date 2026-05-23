import express from "express";
import authRoutes from "./auth.js";
import applicationRoutes from "./applications.js";
import appointmentRoutes from "./appointments.js";
import trackingRoutes from "./tracking.js";
import notificationRoutes from "./notifications.js";
import staffRoutes from "./staff.js";
import recordRoutes from "./records.js";
import announcementRoutes from "./announcements.js";
import complaintRoutes from "./complaints.js";
import adminRoutes from "./admin.js";
import superAdminRoutes from "./superadmin.js";
import formTemplateRoutes from "./formTemplates.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/applications", applicationRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/tracking", trackingRoutes);
router.use("/notifications", notificationRoutes);
router.use("/staff", staffRoutes);
router.use("/records", recordRoutes);
router.use("/announcements", announcementRoutes);
router.use("/complaints", complaintRoutes);
router.use("/admin", adminRoutes);
router.use("/super-admin", superAdminRoutes);
router.use("/form-templates", formTemplateRoutes);

export default router;
