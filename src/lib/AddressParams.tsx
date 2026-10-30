"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Reports the address's ?query parameters to `onChange`, now and whenever
 * they change, and renders nothing.
 *
 * Pages are prerendered before anyone's address is known, and a component
 * that reads it with useSearchParams has its whole part of the page thrown
 * away and redrawn once the browser takes over. For the shop that was the
 * whole product grid, painted a second time seconds later on a phone. Kept to
 * this one empty component, only it waits: the page keeps the grid it was
 * served, and applies the address's filters when they arrive.
 */
export default function AddressParams({ onChange }: { onChange: (params: URLSearchParams) => void }) {
  return (
    <Suspense fallback={null}>
      <Watch onChange={onChange} />
    </Suspense>
  );
}

function Watch({ onChange }: { onChange: (params: URLSearchParams) => void }) {
  const key = useSearchParams().toString();
  useEffect(() => onChange(new URLSearchParams(key)), [key, onChange]);
  return null;
}
