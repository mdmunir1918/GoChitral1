"use client";

import { useState } from "react";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;

export function HotelPhotosInput() {
  const [error, setError] = useState("");

  return <label className="grid gap-1.5 text-sm font-medium">Upload photos <span className="font-normal text-muted">Up to 5 JPEG, PNG, WebP, or AVIF photos. Each photo must be 5 MB or smaller; total selection must be 25 MB or smaller.</span>
    <input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple aria-describedby={error ? "hotel-photo-error" : undefined} onChange={(event) => {
      const files = Array.from(event.currentTarget.files ?? []);
      const totalBytes = files.reduce((total, file) => total + file.size, 0);
      const tooMany = files.length > MAX_PHOTOS;
      const tooLarge = files.some((file) => file.size > MAX_PHOTO_BYTES);
      const totalTooLarge = totalBytes > MAX_TOTAL_BYTES;
      if (tooMany || tooLarge || totalTooLarge) {
        event.currentTarget.value = "";
        setError(tooMany ? "Choose no more than five photos." : tooLarge ? "Each photo must be 5 MB or smaller." : "The selected photos total more than 25 MB. Choose fewer or smaller photos.");
      } else {
        setError("");
      }
    }} className="rounded-xl border border-border bg-white p-3 text-sm font-normal" />
    {error && <span id="hotel-photo-error" role="alert" className="text-sm font-normal text-red-800">{error}</span>}
  </label>;
}
