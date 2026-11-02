"use client";

import { Star } from "lucide-react";

export function StarPicker({
  value,
  onChange,
  size = 22,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          aria-label={`${i + 1} star${i === 0 ? "" : "s"}`}
          aria-pressed={value === i + 1}
          className="rounded p-0.5 transition hover:scale-110"
        >
          <Star size={size} className={i < value ? "fill-accent-light text-accent-light" : "text-foreground/25"} />
        </button>
      ))}
    </div>
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? "fill-accent-light text-accent-light" : "text-foreground/25"}
        />
      ))}
    </span>
  );
}
