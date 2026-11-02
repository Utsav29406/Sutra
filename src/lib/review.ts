export interface Review {
  id: string;
  productId: string;
  /** Set only when the review came from the post-delivery feedback flow. */
  orderId?: string;
  author: string;
  rating: number;
  body: string;
  writtenAt: string;
}

export function newReviewId(): string {
  return `rev-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
