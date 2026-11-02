import { NextRequest, NextResponse } from "next/server";
import { listReviews, createReview } from "@/lib/server/reviews";
import type { Review } from "@/lib/review";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, reviews: await listReviews() });
  } catch (error) {
    console.error("[reviews GET]", error);
    return NextResponse.json({ ok: false, error: "Could not load reviews." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Reading reviews stays public; writing one needs an account, matching the
  // "Write a review" button - which, running in the browser, could be skipped.
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to write a review." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const review = body?.review as Partial<Review> | undefined;

  if (!review || typeof review !== "object" || typeof review.productId !== "string") {
    return NextResponse.json({ ok: false, error: "That review looks incomplete." }, { status: 400 });
  }

  try {
    const result = await createReview(review, session);
    return NextResponse.json(result, { status: result.ok ? 201 : 400 });
  } catch (error) {
    console.error("[reviews POST]", error);
    return NextResponse.json(
      { ok: false, error: "Could not save your review. Please try again." },
      { status: 500 }
    );
  }
}
