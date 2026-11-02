import { ImageResponse } from "next/og";

/*
 * The picture shown when a Sutra link is shared (WhatsApp, LinkedIn, Google's
 * previews). Product pages use the piece's own photo instead.
 */
export const alt = "Sutra — Indian Traditional Wear";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 45%, #3a2a1c 0%, #1a1416 62%)",
          color: "#f5eee8",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="150" height="96" viewBox="0 0 30 20">
            <circle cx="10" cy="10" r="7.5" fill="none" stroke="#c24a4a" strokeWidth="2.6" />
            <circle cx="20" cy="10" r="7.5" fill="none" stroke="#c24a4a" strokeWidth="2.6" />
          </svg>
          <div style={{ fontSize: 132, letterSpacing: 2 }}>sutRa</div>
        </div>
        <div style={{ marginTop: 28, fontSize: 30, letterSpacing: 12, color: "#d4af37", textTransform: "uppercase" }}>
          Indian Traditional Wear
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34, color: "#b8860b" }}>
          <div style={{ width: 120, height: 2, background: "#b8860b" }} />
          <div style={{ width: 12, height: 12, background: "#d4af37", transform: "rotate(45deg)" }} />
          <div style={{ width: 120, height: 2, background: "#b8860b" }} />
        </div>
        <div style={{ marginTop: 30, fontSize: 30, color: "rgba(245,238,232,0.75)" }}>
          Sarees · Lehengas · Kurtas · Sherwanis, woven across India
        </div>
      </div>
    ),
    size
  );
}
