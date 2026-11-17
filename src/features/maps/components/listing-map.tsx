"use client";

import { useEffect, useRef } from "react";
import type { FeatureCollection, Point } from "geojson";
import type { Map as MapLibreMap } from "maplibre-gl";

export type MapPoint = {
  id: string;
  title: string;
  location: string;
  href?: string;
  latitude: number;
  longitude: number;
};

export function ListingMap({ points, label = "Map of locations" }: { points: MapPoint[]; label?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const data = useRef(points);

  useEffect(() => {
    data.current = points;
    if (mapRef.current) {
      const source = mapRef.current.getSource("listings") as { setData?: (value: FeatureCollection<Point>) => void } | undefined;
      source?.setData?.(toGeoJson(points));
      fitPoints(mapRef.current, points);
    }
  }, [points]);

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    let map: MapLibreMap | null = null;
    async function initialize() {
      const { AttributionControl, Map: MapLibreMapImpl, NavigationControl, Popup, setWorkerUrl } = await import("maplibre-gl");
      if (disposed || !container.current) return;
      setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());
      map = new MapLibreMapImpl({ container: container.current, style: "https://tiles.openfreemap.org/styles/liberty", center: [71.78, 35.85], zoom: 7 });
      mapRef.current = map;
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new AttributionControl({ compact: true }));
      map.on("load", () => {
        if (!map) return;
        map.addSource("listings", { type: "geojson", data: toGeoJson(data.current) });
        map.addLayer({ id: "listing-points", type: "circle", source: "listings", paint: { "circle-radius": 8, "circle-color": "#176b58", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } });
        map.on("click", "listing-points", (event) => {
          const feature = event.features?.[0];
          if (!feature) return;
          const p = feature.properties as { title: string; location: string; href: string };
          const content = document.createElement("div");
          const title = document.createElement(p.href ? "a" : "strong");
          title.textContent = p.title;
          if (p.href) { title.setAttribute("href", p.href); title.className = "font-semibold text-emerald-800 underline"; }
          const location = document.createElement("p");
          location.textContent = p.location;
          location.className = "mt-1 text-sm";
          content.append(title, location);
          new Popup({ closeButton: true, closeOnClick: true }).setLngLat((feature.geometry as Point).coordinates as [number, number]).setDOMContent(content).addTo(map!);
        });
        map.on("mouseenter", "listing-points", () => { if (map) map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "listing-points", () => { if (map) map.getCanvas().style.cursor = ""; });
        fitPoints(map, data.current);
      });
    }
    void initialize();
    return () => { disposed = true; map?.remove(); mapRef.current = null; };
  }, []);

  return <section aria-label={label} className="overflow-hidden rounded-2xl border border-border bg-white">
    <div ref={container} className="h-[300px] w-full sm:h-[380px]" role="img" aria-label={label} />
    <p className="border-t border-border px-4 py-2 text-xs text-muted">Map data © OpenStreetMap contributors · Tiles by OpenFreeMap · MapLibre</p>
  </section>;
}

function toGeoJson(points: MapPoint[]): FeatureCollection<Point> {
  return { type: "FeatureCollection", features: points.map((point) => ({ type: "Feature", geometry: { type: "Point", coordinates: [point.longitude, point.latitude] }, properties: { title: point.title, location: point.location, href: point.href ?? "" } })) };
}

function fitPoints(map: MapLibreMap, points: MapPoint[]) {
  if (points.length === 1) map.flyTo({ center: [points[0].longitude, points[0].latitude], zoom: 11, duration: 0 });
  else if (points.length > 1) {
    const longitudes = points.map((point) => point.longitude);
    const latitudes = points.map((point) => point.latitude);
    map.fitBounds([[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]], { padding: 48, maxZoom: 12, duration: 0 });
  }
}

