"use client";

import { useState } from "react";
import Image from "next/image";

function isVideo(src: string) {
  if (!src) return false;
  return 
  src.toLowerCase().endsWith(".mp4");
}

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const activeSrc = images[active];
  if (!activeSrc) {
  return (
    <div className="rounded-xl border p-8 text-center">
      Product images coming soon.
    </div>
  );
}

  return (
    <div className="flex gap-3">
      <div className="flex flex-col gap-2">
        {images.map((img, i) => (
          <button
            key={img}
            onClick={() => setActive(i)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
              i === active
                ? "border-amber-500"
                : "border-zinc-200 hover:border-amber-300"
            }`}
          >
            {isVideo(img) ? (
              <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-white text-xl">
                ▶
              </div>
            ) : (
              <Image src={img} alt={`${name} view ${i + 1}`} fill className="object-cover" />
            )}
          </button>
        ))}
      </div>

      <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-xl mx-auto bg-zinc-50">
        {isVideo(activeSrc) ? (
          <video
            src={activeSrc}
            controls
            className="h-full w-full object-contain"
          />
        ) : (
          <Image
            src={activeSrc}
            alt={name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
          />
        )}
      </div>
    </div>
  );
}