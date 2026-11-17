import { z } from "zod";

export const hotelProfileSchema = z.object({
  name: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(5).max(240),
  description: z.string().trim().min(30).max(5000),
  location: z.string().trim().min(2).max(300),
  latitude: z.union([z.literal(""), z.coerce.number().min(-90).max(90)]),
  longitude: z.union([z.literal(""), z.coerce.number().min(-180).max(180)]),
  amenities: z.string().max(2000),
  phone: z.string().trim().max(40),
  whatsapp: z.string().trim().max(40),
  imageUrls: z.string().max(6000),
});

export const roomTypeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(5).max(1000),
  occupancy: z.coerce.number().int().min(1).max(20),
  pricePerNight: z.coerce.number().positive().max(10_000_000),
});

export function formDataObject(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "").trim()]));
}

export function readableIssues(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}
