import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  role: z.enum(["citizen"]).default("citizen"),
  phone: z.string().trim().min(3).max(30),
  address: z.string().trim().min(2).max(200).optional(),
  subCity: z.string().trim().min(2),
  woreda: z.string().trim().min(1),
  sex: z.enum(["Male", "Female"]).optional(),
  dateOfBirth: z.string().optional(),
  motherName: z.string().trim().min(2).max(100).optional(),
  fatherName: z.string().trim().min(2).max(100).optional(),
  nationality: z.string().trim().min(2).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Identifier/email is required"),
  password: z.string().min(8),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[0-9]/, "Password must include a number"),
    confirmPassword: z.string().min(8),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Password confirmation does not match",
    path: ["confirmPassword"],
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
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
