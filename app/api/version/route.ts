// Reports which commit this build was made from. The deploy workflow polls it
// after shipping to confirm the public site really serves the new version.
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(
    { sha: process.env.GIT_SHA || "unknown" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
