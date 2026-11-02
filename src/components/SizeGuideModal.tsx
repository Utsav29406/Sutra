"use client";

import { useEffect } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { X } from "lucide-react";

const SIZE_CHART = [
  { size: "XS", bust: 32, waist: 26, hip: 35 },
  { size: "S", bust: 34, waist: 28, hip: 37 },
  { size: "M", bust: 36, waist: 30, hip: 39 },
  { size: "L", bust: 38, waist: 32, hip: 41 },
  { size: "XL", bust: 40, waist: 34, hip: 43 },
  { size: "XXL", bust: 42, waist: 36, hip: 45 },
];

/*
 * Foot length for UK sizes. Without this, footwear fell through to the clothing
 * chart and showed a bust/waist/hip table with every row marked n/a.
 */
const FOOTWEAR_CHART = [
  { size: "UK 6", cm: 24.6, eu: 40 },
  { size: "UK 7", cm: 25.4, eu: 41 },
  { size: "UK 8", cm: 26.2, eu: 42 },
  { size: "UK 9", cm: 27.1, eu: 43 },
  { size: "UK 10", cm: 27.9, eu: 44 },
  { size: "UK 11", cm: 28.8, eu: 45 },
];

const toCm = (inches: number) => Math.round(inches * 2.54);

export function SizeGuideModal({
  open,
  onClose,
  sizes,
}: {
  open: boolean;
  onClose: () => void;
  sizes: string[];
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const isFreeSize = sizes.length === 1 && sizes[0].toLowerCase() === "free size";
  const isFootwear = sizes.length > 0 && sizes.every((s) => s.startsWith("UK "));
  const offeredSizes = new Set(sizes);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Size guide"
            className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-cream shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center justify-between border-b border-white/12 px-6 py-4">
              <h2 className="font-display text-xl text-primary">Size Guide</h2>
              <button onClick={onClose} className="rounded-full p-2 transition hover:bg-white/5" aria-label="Close size guide">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {isFreeSize ? (
                <p className="text-sm leading-relaxed text-foreground/70">
                  This piece is cut as <strong>Free Size</strong> — a saree, dupatta or shawl is draped rather than
                  fitted, so one length suits every frame. Blouse pieces, where included, are sold unstitched so a
                  tailor can cut them to you.
                </p>
              ) : isFootwear ? (
                <>
                  <p className="mb-4 text-sm text-foreground/65">
                    Stand on a sheet of paper, mark your heel and longest toe, and measure between the marks. Leather
                    sandals give a little with wear, so between two sizes, take the smaller.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[18rem] text-left text-sm">
                      <thead className="border-b border-white/12 text-xs uppercase tracking-[0.12em] text-foreground/50">
                        <tr>
                          <th className="py-2 pr-3 font-semibold">Size</th>
                          <th className="py-2 pr-3 font-semibold">Foot length</th>
                          <th className="py-2 font-semibold">EU</th>
                        </tr>
                      </thead>
                      <tbody className="tabular-nums">
                        {FOOTWEAR_CHART.map((row) => (
                          <tr key={row.size} className={`border-b border-white/10 last:border-0 ${offeredSizes.has(row.size) ? "" : "text-foreground/35"}`}>
                            <td className="py-2.5 pr-3 font-semibold">{row.size}</td>
                            <td className="py-2.5 pr-3">{row.cm} cm</td>
                            <td className="py-2.5">{row.eu}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-4 text-sm text-foreground/65">
                    Body measurements, not garment measurements — measure yourself and pick the nearest row. Between
                    two sizes, take the larger.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[22rem] text-left text-sm">
                      <thead className="border-b border-white/12 text-xs uppercase tracking-[0.12em] text-foreground/50">
                        <tr>
                          <th className="py-2 pr-3 font-semibold">Size</th>
                          <th className="py-2 pr-3 font-semibold">Bust / Chest</th>
                          <th className="py-2 pr-3 font-semibold">Waist</th>
                          <th className="py-2 font-semibold">Hip</th>
                        </tr>
                      </thead>
                      <tbody className="tabular-nums">
                        {SIZE_CHART.map((row) => {
                          const offered = offeredSizes.has(row.size);
                          return (
                            <tr key={row.size} className={`border-b border-white/10 last:border-0 ${offered ? "" : "text-foreground/35"}`}>
                              <td className="py-2.5 pr-3 font-semibold">
                                {row.size}
                                {!offered && <span className="ml-2 text-[10px] font-normal uppercase tracking-wider">n/a</span>}
                              </td>
                              <td className="py-2.5 pr-3">{row.bust}″ · {toCm(row.bust)} cm</td>
                              <td className="py-2.5 pr-3">{row.waist}″ · {toCm(row.waist)} cm</td>
                              <td className="py-2.5">{row.hip}″ · {toCm(row.hip)} cm</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-foreground/50">
                    Indicative only. Handloom and hand-embroidered pieces are cut by the maker, so allow roughly half
                    an inch either way. Anything marked <em>n/a</em> is not offered for this piece.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
