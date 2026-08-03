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

  const goPrev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActive((i) => (i + 1) % images.length);

  if (!activeSrc) {
  return (
    <div className="rounded-xl border p-8 text-center">
      Product images coming soon.
    </div>
  );
}

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
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
            src={encodeURI(activeSrc)}
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

          {images.length > 1 && (
            <>
              <button
                onClick={goPrev}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-zinc-800 shadow hover:bg-white"
              >
                ‹
              </button>
              <button
                onClick={goNext}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-zinc-800 shadow hover:bg-white"
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>
  );
}