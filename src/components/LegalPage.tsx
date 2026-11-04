import type { ReactNode } from "react";

/** Plain reading layout for the privacy policy and terms. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-14 max-md:px-5 max-md:pt-10">
      <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Sutra</p>
      <h1 className="mt-3 font-display text-4xl text-foreground max-md:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-foreground/50">Last updated {updated}</p>
      <div className="mt-10 flex flex-col gap-9 text-[15px] leading-relaxed text-foreground/75">{children}</div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-accent">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
