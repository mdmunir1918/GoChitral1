import type { ActivityCategory, PlaceCategory } from "@prisma/client";

export const placeCategoryLabels: Record<PlaceCategory, string> = {
  DESTINATION: "Destination",
  NATURAL_ATTRACTION: "Natural attraction",
  HISTORICAL_PLACE: "Historical place",
  CULTURAL_PLACE: "Cultural place",
  VIEWPOINT: "Viewpoint",
  RESTAURANT: "Restaurant",
  FOOD_SPOT: "Food spot",
  OTHER: "Other place",
};

export const activityCategoryLabels: Record<ActivityCategory, string> = {
  HIKING: "Hiking",
  CULTURAL_EXPERIENCE: "Cultural experience",
  WILDLIFE: "Wildlife",
  ADVENTURE: "Adventure",
  WELLNESS: "Wellness",
  OTHER: "Other activity",
};

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100) || "listing";
}

export function parseImageUrls(value = "") {
  return [...new Set(value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean))].map((url) => {
    if (url.startsWith("/images/")) return url;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:") return url;
    } catch {
      // Invalid URLs are rejected below.
    }
    throw new Error("Photo links must use HTTPS or be an existing /images/ path.");
  });
}

export function optionalCoordinate(value: number | "" | undefined) {
  return value === "" || value === undefined ? null : value;
}
