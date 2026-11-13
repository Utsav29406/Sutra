import "server-only";
import { NextRequest, NextResponse } from "next/server";

/**
 * Sign-in routes accept JSON only. A page on another site can make the
 * browser POST here with a plain <form> (text/plain, urlencoded or
 * multipart), which needs no CORS permission; such a request could sign the
 * visitor in to an attacker's account, and their next order would land there.
 * A form can't send application/json, and our own pages always do.
 */
export function rejectNonJson(req: NextRequest): NextResponse | null {
  const type = req.headers.get("content-type") ?? "";
  if (type.split(";")[0].trim().toLowerCase() === "application/json") return null;
  return NextResponse.json({ ok: false, error: "Unsupported request." }, { status: 415 });
}
