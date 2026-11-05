import { ALLOWED_EVENT_PARAMS, forward } from "@/lib/events-proxy";

export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams, outgoing = new URLSearchParams();
  for (const key of ALLOWED_EVENT_PARAMS) {
    const value = incoming.get(key);
    if (value !== null && value.length <= 100) outgoing.set(key, value);
  }
  const query = outgoing.toString();
  return forward(request, "events", query ? "?" + query : "");
}
