import { forward } from "@/lib/events-proxy";

export async function GET(request: Request) {
  return forward(request, "cities");
}
