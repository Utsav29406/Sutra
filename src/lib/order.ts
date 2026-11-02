export type OrderStatus =
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Return Requested"
  | "Returned";

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  placedAt: string;
  updatedAt?: string;
  items: OrderItem[];
  total: number;
  discount?: number;
  couponCode?: string;
  paymentMethod: "cod" | "card";
  address: string;
  status: OrderStatus;
  email: string;
  /** Captured at checkout so the emailed invoice can be addressed properly. */
  customerName?: string;
  phone?: string;
}

export const RETURN_WINDOW_DAYS = 7;

export const STATUS_STYLES: Record<OrderStatus, string> = {
  Processing: "bg-amber-100 text-amber-700",
  Shipped: "bg-blue-100 text-blue-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-black/10 text-foreground/60",
  "Return Requested": "bg-orange-100 text-orange-700",
  Returned: "bg-purple-100 text-purple-700",
};

export function canCancel(order: Order): boolean {
  return order.status === "Processing";
}

export function returnDaysLeft(order: Order): number | null {
  if (order.status !== "Delivered") return null;
  const deliveredAt = new Date(order.updatedAt ?? order.placedAt).getTime();
  const daysLeft = Math.ceil(RETURN_WINDOW_DAYS - (Date.now() - deliveredAt) / 864e5);
  return daysLeft > 0 ? daysLeft : 0;
}

export function canRequestReturn(order: Order): boolean {
  const daysLeft = returnDaysLeft(order);
  return daysLeft !== null && daysLeft > 0;
}

export function countsAsRevenue(order: Order): boolean {
  return order.status !== "Cancelled" && order.status !== "Returned";
}

export function journeyIndex(status: OrderStatus): number {
  switch (status) {
    case "Processing":
      return 0;
    case "Shipped":
      return 1;
    case "Delivered":
    case "Return Requested":
    case "Returned":
      return 2;
    default:
      return -1;
  }
}

export function nextStatuses(order: Order): OrderStatus[] {
  switch (order.status) {
    case "Processing":
      return ["Shipped", "Cancelled"];
    case "Shipped":
      return ["Delivered"];
    case "Return Requested":
      return ["Returned", "Delivered"];
    case "Delivered":
    default:
      return [];
  }
}

export function restoresStock(status: OrderStatus): boolean {
  return status === "Cancelled" || status === "Returned";
}
