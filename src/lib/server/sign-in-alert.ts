import "server-only";
import { after, type NextRequest } from "next/server";
import { sendSignInAlert } from "@/lib/server/email";

/*
 * "New sign-in to your account" emails, on every successful sign-in by
 * password or Google, from a phone or a computer alike. Sent after the
 * response with after(), so signing in is never slowed down by the mail
 * server, and a mail failure can never stop someone signing in.
 */

/** "Chrome on Android", "Safari on iPhone", "Edge on Windows"… from the User-Agent. */
export function describeDevice(ua: string): string {
  const browser =
    /EdgA?\//.test(ua) ? "Edge"
    : /OPR\/|Opera/.test(ua) ? "Opera"
    : /SamsungBrowser\//.test(ua) ? "Samsung Internet"
    : /Firefox\/|FxiOS\//.test(ua) ? "Firefox"
    : /CriOS\/|Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : "A browser";
  const os =
    /iPhone/.test(ua) ? "iPhone"
    : /iPad/.test(ua) ? "iPad"
    : /Android/.test(ua) ? "Android"
    : /Windows/.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/.test(ua) ? "Mac"
    : /CrOS/.test(ua) ? "Chromebook"
    : /Linux/.test(ua) ? "Linux"
    : "an unknown device";
  return `${browser} on ${os}`;
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

/**
 * City and country from Vercel's location headers, when it knows them. (Its
 * state header is only a short code, "GJ", so it is left out.)
 */
function describePlace(req: NextRequest): string | null {
  const read = (name: string) => {
    const value = req.headers.get(name);
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  const country = read("x-vercel-ip-country");
  let countryName: string | null = null;
  try {
    countryName = country ? (countryNames.of(country) ?? country) : null;
  } catch {
    countryName = country;
  }
  const parts = [read("x-vercel-ip-city"), countryName].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function clientIp(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

function indiaTime(date: Date): string {
  const when = date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  return `${when} IST`;
}

/** Queues the email; returns at once. */
export function alertSignIn(req: NextRequest, user: { name: string; email: string }, method: "Password" | "Google") {
  const details = {
    name: user.name,
    method,
    device: describeDevice(req.headers.get("user-agent") ?? ""),
    place: describePlace(req),
    ip: clientIp(req),
    when: indiaTime(new Date()),
    resetUrl: `${req.nextUrl.origin}/forgot-password`,
  };
  after(async () => {
    const mail = await sendSignInAlert(user.email, details).catch((error: Error) => ({ ok: false as const, error: error.message }));
    if (!mail.ok) console.error("[sign-in alert]", user.email, mail.error);
  });
}
