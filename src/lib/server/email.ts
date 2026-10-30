import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { RETURN_WINDOW_DAYS, type Order, type OrderStatus } from "@/lib/order";
import { renderInvoice } from "@/lib/server/invoice";
import { offerLabel } from "@/lib/festival";

/*
 * Two ways out, picked at runtime.
 *
 * SMTP (Gmail) wins when SMTP_USER and SMTP_PASS are set:
 *
 *   SMTP_USER   the full Gmail address
 *   SMTP_PASS   a 16-character App Password, NOT the account password
 *   SMTP_FROM   optional display form, e.g. "Sutra <you@gmail.com>"
 *
 * Resend is used otherwise:
 *
 *   RESEND_API_KEY   from resend.com
 *   OTP_EMAIL_FROM   e.g. "Sutra <orders@yourdomain.com>"
 *
 * Resend will only deliver to the account holder's own address until a domain
 * is verified there, and verifying one needs a domain you control - a
 * *.vercel.app address will not do. Until that exists, SMTP is what actually
 * reaches customers. When the domain is ready, clear the SMTP_* variables and
 * sending returns to Resend with no code change.
 */
const API = "https://api.resend.com/emails";

function smtpConfigured(): boolean {
  return !!(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

/* One transport per warm lambda rather than one per email. */
const globalForMail = globalThis as unknown as {
  sutraTransport?: Transporter;
};

function transport(): Transporter {
  if (!globalForMail.sutraTransport) {
    globalForMail.sutraTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: {
        user: process.env.SMTP_USER!.trim(),
        // App Passwords are shown in groups of four; Google accepts them with
        // or without the spaces, but the SMTP AUTH step does not.
        pass: process.env.SMTP_PASS!.replace(/\s+/g, ""),
      },
    });
  }
  return globalForMail.sutraTransport;
}

/**
 * Everything a customer typed (name, address) is escaped before it goes into
 * an email. Raw, a name like `<a href=…>Verify your payment</a>` came out as a
 * live link in a message sent from the shop's own Gmail.
 */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(order: Order): string {
  return esc(order.customerName?.trim().split(/\s+/)[0] || "friend");
}

function money(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}

type SendResult = { ok: true; id?: string } | { ok: false; error: string };

async function send(args: SendArgs): Promise<SendResult> {
  if (!args.to?.includes("@")) return { ok: false, error: "no recipient address on the order" };
  return smtpConfigured() ? sendViaSmtp(args) : sendViaResend(args);
}

async function sendViaSmtp({ to, subject, html, attachments }: SendArgs): Promise<SendResult> {
  const user = process.env.SMTP_USER!.trim();
  // Gmail rewrites a From it does not own, so the account address is the only
  // one worth sending as - only the display name in front of it is ours.
  const from = process.env.SMTP_FROM?.trim() || `Sutra <${user}>`;

  try {
    const info = await transport().sendMail({
      from,
      to,
      subject,
      html,
      // Resend takes base64 strings; nodemailer wants bytes.
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, "base64"),
      })),
    });
    return { ok: true, id: info.messageId };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

async function sendViaResend({ to, subject, html, attachments }: SendArgs): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.OTP_EMAIL_FROM?.trim() ?? process.env.EMAIL_FROM?.trim();

  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };
  if (!from) return { ok: false, error: "OTP_EMAIL_FROM is not set" };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, ...(attachments ? { attachments } : {}) }),
    });
    const data = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!res.ok) return { ok: false, error: data?.message ?? `Resend returned ${res.status}` };
    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/* ---------------------------------------------------------------- templates */

const SHELL = (body: string, footer = "Questions about your order? Just reply to this email.") => `
<div style="margin:0;padding:24px;background:#1a1416;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#261d1f;border-radius:16px;overflow:hidden">
    <div style="padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,.08)">
      <div style="font-size:24px;font-weight:700;color:#c24a4a;letter-spacing:.5px">sutRa</div>
      <div style="font-size:11px;color:#b8860b;letter-spacing:2px;text-transform:uppercase;margin-top:4px">
        Indian Traditional Wear
      </div>
    </div>
    <div style="padding:28px 32px;color:#f5eee8;font-size:14px;line-height:1.65">${body}</div>
    <div style="padding:18px 32px;border-top:1px solid rgba(255,255,255,.08);color:#9c908b;font-size:11px">
      ${footer}
    </div>
  </div>
</div>`;

function itemRows(order: Order): string {
  return order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;color:#f5eee8">
          ${esc(i.name)}<span style="color:#9c908b"> · ${esc(i.size)} × ${i.quantity}</span>
        </td>
        <td style="padding:8px 0;text-align:right;color:#f5eee8;white-space:nowrap">
          ${money(i.price * i.quantity)}
        </td>
      </tr>`
    )
    .join("");
}

/** One-time code for password recovery. */
export async function sendOtpCode(to: string, code: string): Promise<SendResult> {
  const body = `
    <p style="margin:0 0 4px;font-size:20px;color:#f5eee8">Password reset</p>
    <p style="margin:0 0 22px;color:#c8bdb6">
      Use this code to set a new password. It expires in 2 minutes.
    </p>
    <div style="background:rgba(0,0,0,.25);border-radius:12px;padding:20px;text-align:center">
      <div style="font-size:32px;letter-spacing:10px;color:#d4af37;font-family:monospace">${code}</div>
    </div>
    <p style="margin:22px 0 0;color:#9c908b;font-size:12px">
      If you did not ask to reset your password, ignore this email and nothing will change.
    </p>`;

  return send({ to, subject: `${code} is your Sutra verification code`, html: SHELL(body) });
}

export interface SignInDetails {
  name: string;
  /** "Password" or "Google". */
  method: string;
  /** e.g. "Chrome on Android". */
  device: string;
  /** e.g. "Ahmedabad, Gujarat, India", or null when unknown. */
  place: string | null;
  ip: string | null;
  /** e.g. "14 Oct 2026, 1:35 pm IST". */
  when: string;
  /** Where to reset the password, on this site. */
  resetUrl: string;
}

/**
 * Sent on every sign-in, so someone who gets hold of a password can't use the
 * account without its owner hearing about it.
 */
export async function sendSignInAlert(to: string, d: SignInDetails): Promise<SendResult> {
  const row = (label: string, value: string) => `
      <tr>
        <td style="padding:7px 0;color:#9c908b;width:110px;vertical-align:top">${label}</td>
        <td style="padding:7px 0;color:#f5eee8">${value}</td>
      </tr>`;
  const google = d.method === "Google";
  const body = `
    <p style="margin:0 0 4px;font-size:20px;color:#f5eee8">New sign-in to your account</p>
    <p style="margin:0 0 20px;color:#c8bdb6">
      Hi ${esc(d.name.trim().split(/\s+/)[0] || "there")}, your Sutra account (${esc(to)}) was just signed in.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;background:rgba(0,0,0,.25);border-radius:12px">
      <tr><td colspan="2" style="padding:6px 18px 0"></td></tr>
      <tr><td colspan="2" style="padding:0 18px">
        <table style="width:100%;border-collapse:collapse">
          ${row("When", esc(d.when))}
          ${row("Device", esc(d.device))}
          ${row("Location", d.place ? `${esc(d.place)} <span style="color:#9c908b">(approximate)</span>` : "Unknown")}
          ${d.ip ? row("IP address", esc(d.ip)) : ""}
          ${row("Signed in with", google ? "Google" : "Email and password")}
        </table>
      </td></tr>
      <tr><td colspan="2" style="padding:0 0 8px"></td></tr>
    </table>
    <p style="margin:22px 0 0;color:#c8bdb6">If this was you, you don't need to do anything.</p>
    <p style="margin:8px 0 18px;color:#c8bdb6"><b style="color:#f5eee8">Wasn't you?</b> ${
      google
        ? "Someone may have access to your Google account. Change your Google password and check its security page straight away."
        : "Someone may know your password. Set a new one now, and they'll be signed out."
    }</p>
    <a href="${esc(google ? "https://myaccount.google.com/security" : d.resetUrl)}"
       style="display:inline-block;background:#d4af37;color:#1a1416;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">
      ${google ? "Check my Google account" : "Reset my password"}
    </a>`;

  return send({
    to,
    subject: "New sign-in to your Sutra account",
    html: SHELL(body, "This is a security notice sent every time your account is signed in."),
  });
}

/** Builds the PDF attachment for an order, or undefined if rendering fails. */
async function invoiceAttachment(order: Order): Promise<SendArgs["attachments"]> {
  try {
    const pdf = await renderInvoice(order);
    return [{ filename: `Sutra-Invoice-${order.id}.pdf`, content: pdf.toString("base64") }];
  } catch (error) {
    // A broken invoice must not cost the customer their email entirely.
    console.error("[email] invoice render failed", error);
    return undefined;
  }
}

/**
 * Order confirmation, with the invoice attached. The same PDF goes out again on
 * delivery, so the customer has the bill both when they order and when it
 * arrives — whichever email they still have to hand.
 */
export async function sendOrderConfirmation(order: Order): Promise<SendResult> {
  const attachments = await invoiceAttachment(order);

  const body = `
    <p style="margin:0 0 4px;font-size:20px;color:#f5eee8">Dhanyavaad, ${firstName(order)}!</p>
    <p style="margin:0 0 20px;color:#c8bdb6">
      Your order is placed and the weavers have been told. Your invoice is attached
      to this email as a PDF.
    </p>
    <div style="background:rgba(0,0,0,.25);border-radius:10px;padding:16px 18px;margin-bottom:20px">
      <div style="color:#9c908b;font-size:11px;letter-spacing:1.5px;text-transform:uppercase">Order</div>
      <div style="font-size:16px;color:#c24a4a;font-family:monospace;margin-top:4px">${esc(order.id)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${itemRows(order)}
      ${
        order.discount
          ? `<tr><td style="padding:8px 0;color:#c24a4a;border-top:1px solid rgba(255,255,255,.08)">Discount${
              order.couponCode ? ` · ${esc(offerLabel(order.couponCode))}` : ""
            }</td><td style="padding:8px 0;text-align:right;color:#c24a4a;border-top:1px solid rgba(255,255,255,.08)">−${money(
              order.discount
            )}</td></tr>`
          : ""
      }
      <tr>
        <td style="padding:12px 0 0;border-top:1px solid rgba(255,255,255,.12);font-weight:700">Total</td>
        <td style="padding:12px 0 0;border-top:1px solid rgba(255,255,255,.12);text-align:right;font-weight:700;color:#c24a4a">
          ${money(order.total)}
        </td>
      </tr>
    </table>
    <p style="margin:22px 0 4px;color:#9c908b;font-size:11px;letter-spacing:1.5px;text-transform:uppercase">Delivering to</p>
    <p style="margin:0;color:#c8bdb6;white-space:pre-line">${esc(order.address)}</p>
    <p style="margin:20px 0 0;color:#c8bdb6">
      Payment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Card / UPI"}
    </p>`;

  return send({
    to: order.email,
    subject: `Order ${order.id} confirmed — Sutra`,
    html: SHELL(body),
    attachments,
  });
}

const STATUS_COPY: Partial<Record<OrderStatus, { subject: string; line: string }>> = {
  Shipped: {
    subject: "is on its way",
    line: "Your order has left us and is on its way to you.",
  },
  // Delivered is handled separately below - it carries the invoice PDF.
  Delivered: { subject: "has been delivered", line: "" },
  Cancelled: {
    subject: "has been cancelled",
    line: "Your order has been cancelled and nothing has been charged.",
  },
  "Return Requested": {
    subject: "return has been requested",
    line: "We have received your return request and will be in touch shortly.",
  },
  Returned: {
    subject: "return is complete",
    line: "Your return is complete. Any refund due will follow shortly.",
  },
};

/**
 * Status-change notification. Returns null for statuses not worth emailing about.
 *
 * Delivery is the exception: that one carries the invoice PDF and keeps the body
 * short, since the attachment is the point of the message.
 */
export async function sendOrderStatusUpdate(order: Order): Promise<SendResult | null> {
  const copy = STATUS_COPY[order.status];
  if (!copy) return null;

  if (order.status === "Delivered") {
    const attachments = await invoiceAttachment(order);
    const delivered = `
      <p style="margin:0 0 4px;font-size:20px;color:#f5eee8">Delivered, ${firstName(order)}.</p>
      <p style="margin:0 0 20px;color:#c8bdb6">
        Your order has arrived. Your invoice for order
        <span style="color:#c24a4a;font-family:monospace">${esc(order.id)}</span>
        is attached to this email as a PDF.
      </p>
      <p style="margin:0;color:#9c908b;font-size:13px">
        Keep it for your records. If anything is not right, reply to this email
        within ${RETURN_WINDOW_DAYS} days and we will put it right.
      </p>`;

    return send({
      to: order.email,
      subject: `Your invoice for order ${order.id} — Sutra`,
      html: SHELL(delivered),
      attachments,
    });
  }

  const body = `
    <p style="margin:0 0 4px;font-size:20px;color:#f5eee8">Namaste, ${firstName(order)}</p>
    <p style="margin:0 0 20px;color:#c8bdb6">${copy.line}</p>
    <div style="background:rgba(0,0,0,.25);border-radius:10px;padding:16px 18px">
      <div style="color:#9c908b;font-size:11px;letter-spacing:1.5px;text-transform:uppercase">Order</div>
      <div style="font-size:16px;color:#c24a4a;font-family:monospace;margin:4px 0 12px">${esc(order.id)}</div>
      <div style="color:#9c908b;font-size:11px;letter-spacing:1.5px;text-transform:uppercase">Status</div>
      <div style="font-size:15px;color:#f5eee8;margin-top:4px">${order.status}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:20px">
      ${itemRows(order)}
      <tr>
        <td style="padding:12px 0 0;border-top:1px solid rgba(255,255,255,.12);font-weight:700">Total</td>
        <td style="padding:12px 0 0;border-top:1px solid rgba(255,255,255,.12);text-align:right;font-weight:700;color:#c24a4a">
          ${money(order.total)}
        </td>
      </tr>
    </table>`;

  return send({
    to: order.email,
    subject: `Order ${order.id} ${copy.subject} — Sutra`,
    html: SHELL(body),
  });
}
