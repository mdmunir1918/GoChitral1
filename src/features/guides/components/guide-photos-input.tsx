"use client";

import { useState } from "react";

const MAX_COUNT = 5;
const MAX_EACH = 5 * 1024 * 1024;
const MAX_TOTAL = 25 * 1024 * 1024;

export function GuidePhotosInput({ urls }: { urls: string[] }) {
  const [error, setError] = useState("");
  return <>
    <label className="grid gap-1.5 text-sm font-medium">Portfolio photo links <span className="font-normal text-muted">One HTTPS link per line. Leaving this blank keeps the current photos.</span><textarea name="imageUrls" defaultValue={urls.join("\n")} className="min-h-20 rounded-xl border border-border bg-white p-3 font-normal" /></label>
    <label className="grid gap-1.5 text-sm font-medium">Upload portfolio photos <span className="font-normal text-muted">Up to 5 JPEG, PNG, WebP, or AVIF files; 5 MB each and 25 MB total.</span>
      <input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple aria-describedby={error ? "guide-photo-error" : undefined} onChange={(event) => {
        const files = Array.from(event.currentTarget.files ?? []);
        const total = files.reduce((sum, file) => sum + file.size, 0);
        if (files.length > MAX_COUNT || files.some((file) => file.size > MAX_EACH) || total > MAX_TOTAL) {
          const message = files.length > MAX_COUNT ? "Choose no more than five photos." : files.some((file) => file.size > MAX_EACH) ? "Each photo must be 5 MB or smaller." : "The selected photos total more than 25 MB.";
          event.currentTarget.value = "";
          setError(message);
        } else setError("");
      }} className="rounded-xl border border-border bg-white p-3 text-sm font-normal" />
      {error && <span id="guide-photo-error" role="alert" className="text-sm font-normal text-red-800">{error}</span>}
    </label>
  </>;
}
