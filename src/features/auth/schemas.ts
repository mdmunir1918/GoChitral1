import { z } from "zod";

const email = z.string().trim().email("Enter a valid email address.").toLowerCase();
const password = z
  .string()
  .min(8, "Use at least 8 characters for your password.")
  .max(72, "Use no more than 72 characters for your password.")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password is too long.");
const phone = z
  .string()
  .trim()
  .regex(/^[+0-9 ()-]{7,24}$/, "Enter a valid phone number.");
const commaSeparated = z
  .string()
  .trim()
  .min(1, "Add at least one item.")
  .transform((value) => [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))]);

export const loginSchema = z.object({ email, password: z.string().min(1) });

export const touristRegistrationSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email,
  password,
});

export const passwordResetRequestSchema = z.object({ email });

export const passwordResetSchema = z.object({
  token: z.string().length(43),
  password,
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  message: "The passwords do not match.",
  path: ["confirmPassword"],
});

export const guideApplicationSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email,
  password,
  phone,
  whatsapp: phone,
  biography: z.string().trim().min(30, "Tell us a little more about your guiding experience.").max(3000),
  experienceYears: z.coerce.number().int().min(0).max(70),
  languages: commaSeparated,
  regionsCovered: commaSeparated,
  specialties: commaSeparated,
  services: commaSeparated,
  verificationDetails: z.string().trim().min(15, "Add details that can help us verify your application.").max(2000),
});

export const hotelApplicationSchema = z.object({
  ownerName: z.string().trim().min(2, "Enter the owner's name.").max(100),
  email,
  password,
  phone,
  whatsapp: phone,
  hotelName: z.string().trim().min(2).max(160),
  hotelLocation: z.string().trim().min(3).max(300),
  hotelDescription: z.string().trim().min(30).max(3000),
  businessDetails: z.string().trim().min(15).max(2000),
  verificationDetails: z.string().trim().min(15).max(2000),
});

export type AuthActionState = {
  error?: string;
  status?: "EMAIL_EXISTS" | "RESET_REQUESTED" | "PASSWORD_RESET";
};

export function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
