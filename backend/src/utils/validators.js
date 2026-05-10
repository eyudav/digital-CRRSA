import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["citizen", "staff", "admin", "super_admin"]).default("citizen"),
  phone: z.string().trim().min(3).max(30).optional(),
  address: z.string().trim().min(2).max(200).optional(),
  subCity: z.string().trim().min(2),
  woreda: z.string().trim().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const applicationSchema = z.object({
  serviceType: z.string().min(2),
  officeCode: z.string().min(2),
  formData: z.record(z.any()),
});

export const appointmentSchema = z.object({
  applicationId: z.number().int().positive(),
  slotId: z.number().int().positive(),
  officeCode: z.string().min(2),
});
