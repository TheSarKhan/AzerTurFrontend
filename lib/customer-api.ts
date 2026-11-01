export type Customer = {
  id: string;
  email: string;
  name: string;
  locale: "en" | "ru" | "az";
};
export type Booking = {
  id: string;
  customerId: string;
  quoteId: string;
  status:
    | "PENDING_REVIEW"
    | "AWAITING_PAYMENT"
    | "CONFIRMED"
    | "REJECTED"
    | "CANCELLED";
  currency: "EUR" | "USD" | "AZN";
  total: number;
  deposit: number;
  paid: number;
  departure: string;
  title: string;
  quotePayload: string;
  customerNote: string;
  operatorNote: string;
  createdAt: string;
};
export type BookingRequest = {
  id: string;
  bookingId: string;
  kind: "CHANGE" | "CANCEL";
  message: string;
  status: string;
  response: string;
  createdAt: string;
};
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export async function customerApi<T>(
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<T> {
  const response = await fetch("/api/customer/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({ error: "REQUEST_FAILED" }));
    throw new ApiError(response.status, data.error || "REQUEST_FAILED");
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
