import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_PROXY_TARGET = (
  process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8001"
).replace(/\/$/, "");

async function proxy(request: NextRequest, path: string[]) {
  const suffix = path.join("/");
  const incoming = new URL(request.url);
  const target = new URL(`${API_PROXY_TARGET}/${suffix}`);
  // Django APPEND_SLASH expects a trailing slash on API routes.
  if (!target.pathname.endsWith("/")) {
    target.pathname = `${target.pathname}/`;
  }
  target.search = incoming.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("transfer-encoding");
  // Keep browser fetches on the same-origin proxy if Django redirects.
  const location = responseHeaders.get("location");
  if (location) {
    try {
      const loc = new URL(location, API_PROXY_TARGET);
      if (
        loc.origin === new URL(API_PROXY_TARGET).origin ||
        location.startsWith("/")
      ) {
        responseHeaders.set(
          "location",
          `/backend${loc.pathname}${loc.search}${loc.hash}`,
        );
      }
    } catch {
      /* keep upstream Location */
    }
  }
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: Ctx) {
  const { path } = await context.params;
  return proxy(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
