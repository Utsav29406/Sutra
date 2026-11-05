/*
 * Cashfree's checkout window, in the browser. The order and its payment session
 * are made on the server (api/orders); this only opens the window and reports
 * that it closed. Whether the money arrived is always asked of the server
 * (api/payments/verify), never taken from the window's answer.
 */

type CashfreeResult = { error?: { message?: string }; redirect?: boolean; paymentDetails?: unknown };
type CashfreeInstance = {
  checkout: (options: { paymentSessionId: string; redirectTarget: "_modal" | "_self" }) => Promise<CashfreeResult>;
};
declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeInstance;
  }
}

let loading: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (window.Cashfree) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Could not load the payment window."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Opens the payment popup and resolves once it closes, however it closed. */
export async function openCashfreeCheckout(sessionId: string, mode: "sandbox" | "production"): Promise<void> {
  await loadSdk();
  const cashfree = window.Cashfree!({ mode });
  await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_modal" });
}

/** The server's answer on whether the order is paid. */
export async function verifyPayment(
  orderId: string
): Promise<{ paid: boolean; error?: string; order?: import("@/lib/order").Order }> {
  try {
    const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json().catch(() => null);
    if (!data?.ok) return { paid: false, error: data?.error ?? "Could not check the payment." };
    return { paid: !!data.paid, ...(data.order ? { order: data.order } : {}) };
  } catch {
    return { paid: false, error: "Could not reach the server to check the payment." };
  }
}
