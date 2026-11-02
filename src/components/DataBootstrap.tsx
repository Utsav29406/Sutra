"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth";

/**
 * Pulls orders and reviews out of Postgres once per page load. Mounted in the root
 * layout so every route has the shared caches filled without each one asking.
 */
export default function DataBootstrap() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return null;
}
