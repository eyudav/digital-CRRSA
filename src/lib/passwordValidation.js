import { z } from "zod";

/** Matches backend registerSchema / changePasswordSchema password rules */
export const passwordFieldSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");

export const PASSWORD_HINT =
  "At least 8 characters with uppercase, lowercase, and a number.";
