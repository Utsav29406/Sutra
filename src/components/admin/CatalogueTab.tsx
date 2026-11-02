"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, Search, TriangleAlert } from "lucide-react";
import { products } from "@/lib/products";
import { formatPrice } from "@/lib/utils";

type SortKey = "name" | "category" | "price" | "stock" | "rating";

export function CatalogueTab({ consumed }: { consumed: Record<string, number> }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [ascending, setAscending] = useState(true);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const direction = ascending ? 1 : -1;
    const filtered = products
      .map((p) => ({ product: p, stock: Math.max(0, p.stock - (consumed[p.id] ?? 0)) }))
      .filter(
        ({ product }) =>
          !q || `${product.name} ${product.category.name} ${product.craftName ?? ""} ${product.state ?? ""}`.toLowerCase().includes(q)
      );
    return filtered.sort((a, b) => {
      switch (sortKey) {
        case "price":
          return (a.product.price - b.product.price) * direction;
        case "stock":
          return (a.stock - b.stock) * direction;
        case "rating":
          return (a.product.rating - b.product.rating) * direction;
        case "category":
          return a.product.category.name.localeCompare(b.product.category.name) * direction;
        default:
          return a.product.name.localeCompare(b.product.name) * direction;
      }
    });
  }, [query, sortKey, ascending, consumed]);

  const soldOut = rows.filter((r) => r.stock === 0).length;
  const lowStock = rows.filter((r) => r.stock > 0 && r.stock <= 3).length;

  function sortBy(key: SortKey) {
    if (sortKey === key) setAscending((a) => !a);
    else {
      setSortKey(key);
      setAscending(key === "name" || key === "category" || key === "stock");
    }
  }

  const columns: Array<{ key: SortKey; label: string }> = [
    { key: "name", label: "Product" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price" },
    { key: "stock", label: "Stock" },
    { key: "rating", label: "Rating" },
  ];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, craft or state"
            aria-label="Search catalogue"
            className="w-full rounded-full border border-white/12 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        {(soldOut > 0 || lowStock > 0) && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700">
            <TriangleAlert size={14} />
            {soldOut > 0 && `${soldOut} sold out`}
            {soldOut > 0 && lowStock > 0 && " · "}
            {lowStock > 0 && `${lowStock} running low`}
          </p>
        )}
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-cream-dark/70">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.1em] text-foreground/50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-5 py-3 font-semibold">
                  <button
                    onClick={() => sortBy(col.key)}
                    className={`flex items-center gap-1 transition-colors hover:text-primary ${sortKey === col.key ? "text-primary" : ""}`}
                    aria-label={`Sort by ${col.label}`}
                  >
                    {col.label}
                    <ArrowUpDown size={11} className="opacity-60" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, stock }) => (
              <tr key={product.id} className="border-b border-white/10 last:border-0">
                <td className="px-5 py-3">
                  <Link href={`/product/${product.slug}`} className="hover:text-primary">
                    {product.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-foreground/60">{product.category.name}</td>
                <td className="px-5 py-3">{formatPrice(product.price)}</td>
                <td className="px-5 py-3">
                  {stock === 0 ? (
                    <span className="rounded-full bg-black/10 px-2.5 py-0.5 text-xs font-semibold text-foreground/60">Sold out</span>
                  ) : stock <= 3 ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">{stock} left</span>
                  ) : (
                    <span className="text-foreground/60">{stock}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-foreground/60">{product.rating.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-5 py-8 text-sm text-foreground/55">Nothing in the catalogue matches that.</p>}
      </div>
      <p className="mt-3 text-xs text-foreground/45">
        Pieces are defined in the codebase, not a database, so they can be read here but not edited.
      </p>
    </div>
  );
}
