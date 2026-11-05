import { forward } from "@/lib/events-proxy";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120)
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  return forward(request, "events/" + slug);
}
