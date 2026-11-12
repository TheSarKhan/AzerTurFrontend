// Transport proxy only. Validation, rate limiting and storage belong to Spring Boot.
export async function POST(request: Request) {
  try {
    const visitor =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      "";
    const response = await fetch(
      `${process.env.API_BASE_URL || "http://127.0.0.1:8080"}/api/v1/contact`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(visitor ? { "CF-Connecting-IP": visitor } : {}),
        },
        body: await request.text(),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      },
    );
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503 });
  }
}
