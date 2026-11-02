import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Several product images in /public/images/products are .svg — the
    // built-in image optimizer refuses to serve SVGs unless explicitly
    // allowed. This is safe here since all images are local, static assets
    // we control (no user-uploaded SVGs).
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  /*
   * PDFKit 0.20 loads its built-in fonts through the subpath import
   * `#standard-fonts/<name>`, which package.json maps to
   * ./js/standard-fonts/<name>.cjs. The font name is chosen at run time, so
   * Next's static tracer sees no reference and shipped the function without
   * them. Production then failed on every invoice with
   *
   *   Cannot find module '#standard-fonts/Helvetica'
   *
   * and because invoiceAttachment catches render errors so a broken PDF cannot
   * cost the customer their email, delivery mails went out with no attachment
   * and nothing visible anywhere. It worked locally the whole time, because
   * node_modules sits right there.
   *
   * Both order routes render a PDF: /api/orders attaches the invoice to the
   * confirmation, /api/orders/[id] sends it again on delivery. Each needs the
   * include separately — a route left out here fails silently, because
   * invoiceAttachment swallows the error and the email still goes out.
   */
  outputFileTracingIncludes: {
    "/api/orders": ["./node_modules/pdfkit/**"],
    "/api/orders/[id]": ["./node_modules/pdfkit/**"],
    "/api/orders/[id]/invoice": ["./node_modules/pdfkit/**"],
  },

  /*
   * Tracing the font files alone was not enough: `#standard-fonts/*` is a
   * package-scoped subpath import, so Node resolves it through pdfkit's own
   * package.json. Bundling the library breaks that lookup no matter which
   * files sit beside it. Marking pdfkit external keeps it a real package on
   * disk, with its package.json and imports map intact.
   */
  serverExternalPackages: ["pdfkit"],

  /*
   * When this build was made. lib/festival leaves out festivals whose offer had
   * already ended by then, and the server and the browser must agree on that
   * list, so the moment is fixed here and inlined into both.
   */
  env: { SUTRA_BUILT_AT: String(Date.now()) },
};

export default nextConfig;
