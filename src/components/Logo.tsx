export function SutraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g className="sutra-knot-inner" fill="none" stroke="currentColor" strokeWidth={10}>
        <path className="sutra-strand" pathLength={100} d="M53.83 34.32 A23 23 0 1 1 45.62 28.67" />
        <path className="sutra-strand" pathLength={100} d="M46.17 65.68 A23 23 0 1 1 54.38 71.33" />
      </g>
    </svg>
  );
}

export function Logo({ className, wordOnly = false }: { className?: string; wordOnly?: boolean }) {
  return (
    <span className={`sutra-logotype inline-flex items-center gap-[0.34em] ${className ?? ""}`}>
      {!wordOnly && <SutraMark className="h-[1.55em] w-[1.55em] shrink-0 text-primary" />}
      <span className="font-sans leading-none tracking-[0.01em]">sutRa</span>
    </span>
  );
}
