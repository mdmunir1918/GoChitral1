import { z } from "zod";

const coordinate = z.coerce.number().finite();

const sharedListing = {
  name: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(10).max(240),
  description: z.string().trim().min(20).max(6000),
  location: z.string().trim().min(2).max(160),
  latitude: z.union([z.literal(""), coordinate]).optional(),
  longitude: z.union([z.literal(""), coordinate]).optional(),
  imageUrls: z.string().max(5000).optional(),
};

function validateCoordinates<T extends { latitude?: number | ""; longitude?: number | "" }>(
  schema: z.ZodType<T>,
) {
  return schema.superRefine((value, context) => {
    const hasLatitude = value.latitude !== undefined && value.latitude !== "";
    const hasLongitude = value.longitude !== undefined && value.longitude !== "";
    if (hasLatitude !== hasLongitude) {
      context.addIssue({ code: "custom", message: "Enter both coordinates or leave both blank." });
    }
    if (hasLatitude && (Number(value.latitude) < -90 || Number(value.latitude) > 90)) {
      context.addIssue({ code: "custom", message: "Latitude must be between -90 and 90." });
    }
    if (hasLongitude && (Number(value.longitude) < -180 || Number(value.longitude) > 180)) {
      context.addIssue({ code: "custom", message: "Longitude must be between -180 and 180." });
    }
  });
}

export const placeFields = z.object({
  ...sharedListing,
  category: z.enum([
    "DESTINATION", "NATURAL_ATTRACTION", "HISTORICAL_PLACE", "CULTURAL_PLACE",
    "VIEWPOINT", "RESTAURANT", "FOOD_SPOT", "OTHER",
  ]),
  cuisine: z.string().trim().max(120).optional(),
  specialties: z.string().max(1000).optional(),
  menuInformation: z.string().trim().max(3000).optional(),
  priceRange: z.string().trim().max(120).optional(),
  openingHours: z.string().trim().max(240).optional(),
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  contactUrl: z.union([z.literal(""), z.string().url().max(500).refine((value) => new URL(value).protocol === "https:", "Contact links must use HTTPS.")]).optional(),
});

export const placeInputSchema = validateCoordinates(placeFields);

export const activityFields = z.object({
  ...sharedListing,
  category: z.enum(["HIKING", "CULTURAL_EXPERIENCE", "WILDLIFE", "ADVENTURE", "WELLNESS", "OTHER"]),
  priceRange: z.string().trim().max(120).optional(),
});

export const activityInputSchema = validateCoordinates(activityFields);

export const placeSuggestionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum([
    "DESTINATION", "NATURAL_ATTRACTION", "HISTORICAL_PLACE", "CULTURAL_PLACE",
    "VIEWPOINT", "RESTAURANT", "FOOD_SPOT", "OTHER",
  ]),
  location: z.string().trim().min(2).max(160),
  description: z.string().trim().min(20).max(2000),
});

export function formDataObject(formData: FormData, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "")]));
}

export function readableIssues(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}
