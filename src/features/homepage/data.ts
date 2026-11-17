import { Compass, Mountain, Route, Utensils } from "lucide-react";

// Small, controlled discovery fixtures for the public homepage until directory records are available.
export const discoveryPlaces = [
  {
    slug: "kalash-valleys",
    name: "Kalash Valleys",
    type: "Culture & valleys",
    summary: "A mountain landscape shaped by the living Kalasha community and its traditions.",
    detail: "Explore the valleys at a thoughtful pace. Learn about local customs before your visit, ask permission before photographing people, and check current road and weather conditions as you plan.",
    icon: Compass,
    tone: "from-emerald-900 to-teal-700",
  },
  {
    slug: "chitral-town",
    name: "Chitral Town",
    type: "Town & culture",
    summary: "A welcoming starting point for discovering the wider Chitral region.",
    detail: "Use Chitral Town as a base to orient yourself, meet local providers, and plan onward journeys through the region. Confirm transport and opening details locally before setting out.",
    icon: Mountain,
    tone: "from-slate-800 to-emerald-800",
  },
  {
    slug: "shandur-highlands",
    name: "Shandur Highlands",
    type: "High mountain scenery",
    summary: "Open highland scenery and a memorable journey through the Hindukush.",
    detail: "The route to high mountain areas can be affected by weather and seasonal access. Check local conditions and arrange suitable transport before travelling.",
    icon: Route,
    tone: "from-sky-900 to-indigo-700",
  },
  {
    slug: "garam-chashma",
    name: "Garam Chashma",
    type: "Mountain escape",
    summary: "A peaceful place to slow down and take in the mountain surroundings.",
    detail: "Plan time for the journey and confirm current road conditions with a local source. Respect the surrounding communities and leave the landscape as you found it.",
    icon: Mountain,
    tone: "from-amber-900 to-emerald-800",
  },
];

export const experienceIdeas = [
  { title: "Walk the valleys", text: "Find a route and pace that fit your trip.", icon: Route, href: "/activities?category=HIKING" },
  { title: "Meet local culture", text: "Discover the people and traditions of Chitral.", icon: Compass, href: "/places?category=CULTURAL_PLACE" },
  { title: "Taste Chitral", text: "Explore local food and dining in the places directory.", icon: Utensils, href: "/places?category=FOOD" },
];

export const foodIdeas = [
  { title: "Local food and hospitality", text: "Food spots will appear here as the Chitral directory is populated." },
  { title: "Plan a meal into your route", text: "Add places to your itinerary once directory listings are available." },
];

export function searchDiscovery(query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [];
  return discoveryPlaces.filter((place) =>
    `${place.name} ${place.type} ${place.summary} ${place.detail}`.toLocaleLowerCase().includes(normalized),
  );
}
