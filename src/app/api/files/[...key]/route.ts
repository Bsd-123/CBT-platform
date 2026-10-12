import { serveFile } from "@/lib/files/serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ key: string[] }> };

async function keyFrom({ params }: RouteContext): Promise<string> {
  return (await params).key.join("/");
}

export async function GET(request: Request, context: RouteContext) {
  return serveFile(request, await keyFrom(context), false);
}

export async function HEAD(request: Request, context: RouteContext) {
  return serveFile(request, await keyFrom(context), true);
}
