import Link from "next/link";
import { logout } from "@/features/auth/actions";
import { StatusToast } from "@/features/tourist/components/status-toast";

const sections = [
  ["/tourist", "Overview"],
  ["/tourist/profile", "Personal info"],
  ["/tourist/preferences", "Travel preferences"],
  ["/tourist/trips", "My trips"],
  ["/tourist/saved", "Saved places"],
  ["/tourist/reviews", "My reviews"],
  ["/tourist/settings", "Account settings"],
] as const;

export function TouristWorkspaceNav() {
  return (
    <nav aria-label="Tourist account" className="flex gap-2 overflow-x-auto pb-2">
      {sections.map(([href, label]) => (
        <Link key={href} href={href} className="shrink-0 rounded-full border border-border bg-white px-4 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary">
          {label}
        </Link>
      ))}
      <form action={logout} className="shrink-0">
        <button className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-foreground">Sign out</button>
      </form>
    </nav>
  );
}

export function StatusMessage({ status }: { status?: string }) {
  const messages: Record<string, string> = {
    saved: "Your changes have been saved.",
    deleted: "The item was deleted successfully.",
    removed: "The item or listing was removed.",
    invalid: "Please check the information and try again.",
    unavailable: "This trip or listing is no longer available.",
    error: "We couldn't save that change. Please try again.",
    created: "Your trip is ready. Start adding places and activities to each day.",
    updated: "Your trip details have been updated.",
    archived: "The trip was archived. You can restore it at any time.",
    restored: "The trip is active again.",
    added: "The item was added to your trip.",
    "item-added": "The item was added to your itinerary.",
    "stay-added": "The accommodation was added to your trip.",
    "day-added": "A new day was added to your trip.",
    "day-removed": "The day was removed. Later days and their itinerary entries moved up one day.",
    "day-has-stay": "This day overlaps a hotel stay. Adjust or remove that stay before removing the day.",
    "last-day": "A trip needs at least one day. You can remove the trip from your trip list if you no longer need it.",
    reordered: "Your itinerary order was updated.",
    "too-long": "Trips can be up to 30 days long. Create a shorter trip to continue.",
    "day-limit": "A trip can have up to 30 days.",
    "trip-completed": "Trip completed. You can find it in your archives.",
  };
  const message = status ? messages[status] : undefined;
  if (!message) return null;
  return <StatusToast key={status} message={message} success={Boolean(status && ["saved", "removed", "deleted", "created", "updated", "archived", "restored", "added", "item-added", "stay-added", "day-added", "day-removed", "reordered", "trip-completed"].includes(status))} />;
}
