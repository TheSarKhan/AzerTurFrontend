// Transport proxy for the public events API. Filtering, distance and validation belong to Spring Boot.
const API = () => process.env.API_BASE_URL || "http://127.0.0.1:8080";

/** The API rate-limits per visitor; without this every website visitor would share this server's address. */
function visitor(request: Request): Record<string, string> {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip && ip.length <= 64 ? { "CF-Connecting-IP": ip } : {};
}

export async function forward(request: Request, path: string, search = ""): Promise<Response> {
  try {
    const response = await fetch(`${API()}/api/v1/${path}${search}`, {
      headers: { Accept: "application/json", ...visitor(request) },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    return new Response(await response.text(), {
      status: response.status,
      // Location searches must never be cached by a browser or CDN.
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export const ALLOWED_EVENT_PARAMS = ["city", "category", "from", "to", "q", "lat", "lng", "radiusKm", "page", "size"];
