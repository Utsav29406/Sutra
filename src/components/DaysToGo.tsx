"use client";

import { daysToGo, type Festival } from "@/lib/festival";
import { useNow } from "@/lib/useFestival";

/**
 * "· 7 days to go" before a festival's offer opens, nothing once it has.
 * Pages are prerendered, so it only appears in the browser (useNow is null
 * until then), and it moves on by itself at midnight and at 6pm on the eve.
 */
export default function DaysToGo({ festival, before = " · " }: { festival: Festival; before?: string }) {
  const now = useNow();
  const label = now === null ? null : daysToGo(festival, now);
  // The words stay together, so on a phone they wrap as one: "starts at" never ends a line.
  return label ? (
    <>
      {before}
      <span className="whitespace-nowrap">{label}</span>
    </>
  ) : null;
}
