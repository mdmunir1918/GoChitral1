import { z } from "zod";

export const guideProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  biography: z.string().trim().min(30).max(3000),
  experienceYears: z.coerce.number().int().min(0).max(70),
  languages: z.string().trim().min(2).max(500),
  regionsCovered: z.string().trim().min(2).max(800),
  specialties: z.string().trim().min(2).max(800),
  services: z.string().trim().min(2).max(1000),
  pricingInformation: z.string().trim().max(1200),
  phone: z.string().trim().min(3).max(40),
  whatsapp: z.string().trim().min(3).max(40),
  imageUrls: z.string().max(6000),
});

export function guideFormData(formData: FormData) {
  return Object.fromEntries(Object.keys(guideProfileSchema.shape).map((key) => [key, String(formData.get(key) ?? "").trim()]));
}

export function guideValidationMessage(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}
