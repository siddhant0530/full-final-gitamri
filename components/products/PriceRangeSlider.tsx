"use client";

import { formatPrice } from "@/lib/formatPrice";

export default function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}) {
  const pctMin = ((valueMin - min) / (max - min)) * 100;
  const pctMax = ((valueMax - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-zinc-700">
        <span>{formatPrice(valueMin)}</span>
        <span>{formatPrice(valueMax)}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-zinc-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-amber-500"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMin}
          onChange={(e) => onChange(Math.min(Number(e.target.value), valueMax - 1), valueMax)}
          className="range-thumb absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => onChange(valueMin, Math.max(Number(e.target.value), valueMin + 1))}
          className="range-thumb absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent"
          aria-label="Maximum price"
        />
      </div>
    </div>
  );
}
