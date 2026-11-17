"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";

export function NearbySearchButton({ radiusKm }: { radiusKm: number }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  function findNearby() {
    if (!navigator.geolocation) { setMessage("Location search is not available in this browser."); return; }
    setBusy(true); setMessage("");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const params = new URLSearchParams(window.location.search);
      params.set("lat", coords.latitude.toFixed(6)); params.set("lon", coords.longitude.toFixed(6)); params.set("radius", String(radiusKm));
      router.push(`/search?${params.toString()}`);
    }, () => { setBusy(false); setMessage("We could not access your location. Check browser permission and try again."); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }
  return <div className="grid gap-1"><button type="button" onClick={findNearby} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-60"><MapPin size={16} aria-hidden="true" />{busy ? "Finding…" : `Near me · ${radiusKm} km`}</button><span aria-live="polite" className="text-xs text-rose-700">{message}</span></div>;
}
