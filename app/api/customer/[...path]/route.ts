import { NextRequest, NextResponse } from "next/server";
const cookie = "azertur_session";
const paths = new RegExp(
  String.raw`^(auth\/(register|login|logout|me|forgot-password|reset-password|verify-email|email-verification/request|logout-all|sessions(/(revoke-others|[0-9a-f-]{36}/revoke))?)|bookings(\/(requests|offers|notifications(\/(read-all|push-token|[0-9a-f-]{36}\/read))?)|\/[0-9a-f-]{36}\/(requests|amendments(/(accept|decline|[0-9a-f-]{36}/(pdf|base-pdf)))?|revised-plan|payment-context|cancellation|cancellation-updates(\/[0-9a-f-]{36}\/pdf)?|demo-payment|contract(\/[0-9a-f-]{36}\/(pdf|accept))?))?)$`,
);
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const path = (await context.params).path.join("/");
  if (!paths.test(path))
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (request.method === "POST") {
    const url = new URL(request.url);
    const host = request.headers.get("host");
    if (!host)
      return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
    const origin = process.env.APP_ORIGIN || url.protocol + "//" + host;
    if (request.headers.get("origin") !== origin)
      return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
    if (!request.headers.get("content-type")?.includes("application/json"))
      return NextResponse.json({ error: "JSON_REQUIRED" }, { status: 415 });
  }
  const isAuth = path === "auth/register" || path === "auth/login";
  const isPublic =
    isAuth ||
    [
      "auth/forgot-password",
      "auth/reset-password",
      "auth/verify-email",
    ].includes(path);
  const token = request.cookies.get(cookie)?.value;
  if (!isPublic && !token)
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  let body: string | undefined;
  if (request.method === "POST") {
    const reader = request.body?.getReader();
    const parts: Buffer[] = [];
    let size = 0;
    if (reader)
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 16384) {
          await reader.cancel();
          return NextResponse.json(
            { error: "REQUEST_TOO_LARGE" },
            { status: 413 },
          );
        }
        parts.push(Buffer.from(chunk.value));
      }
    body = Buffer.concat(parts).toString("utf8");
  }
  try {
    const upstream = await fetch(
      (process.env.API_BASE_URL || "http://127.0.0.1:8080") + "/api/v1/" + path,
      {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": (
            request.headers.get("user-agent") || "Other device"
          ).slice(0, 512),
          ...(!isPublic && token ? { Authorization: "Bearer " + token } : {}),
          ...(request.headers.has("idempotency-key")
            ? { "Idempotency-Key": request.headers.get("idempotency-key")! }
            : {}),
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if ((path.endsWith("/pdf") || path.endsWith("/base-pdf")) && upstream.ok) {
      return new NextResponse(await upstream.arrayBuffer(), {
        status: upstream.status,
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": path.includes("cancellation-updates")
            ? "attachment; filename=cancellation-summary.pdf"
            : "inline; filename=contract.pdf",
        },
      });
    }
    let data = upstream.status === 204 ? null : await upstream.json();
    const session = isAuth && upstream.ok ? data : null;
    if (session)
      data = { customer: session.customer, expires: session.expires };
    const result =
      upstream.status === 204
        ? new NextResponse(null, { status: 204 })
        : NextResponse.json(data, { status: upstream.status });
    result.headers.set("Cache-Control", "no-store");
    if (session)
      result.cookies.set(cookie, session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.SESSION_COOKIE_SECURE === "false"
            ? false
            : process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(session.expires),
      });
    if (
      (["auth/logout", "auth/logout-all", "auth/reset-password"].includes(
        path,
      ) &&
        upstream.ok) ||
      (upstream.status === 401 && !isPublic)
    )
      result.cookies.set(cookie, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    return result;
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503 });
  }
}
export const GET = proxy;
export const POST = proxy;
