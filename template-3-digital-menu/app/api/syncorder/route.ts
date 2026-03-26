import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Read from PROXY_SECRET first, fall back to NEXT_PUBLIC_PROXY_SECRET for compat
    const proxySecret = process.env.PROXY_SECRET || process.env.NEXT_PUBLIC_PROXY_SECRET;

    if (!proxySecret) {
      console.error("[NEXT API] PROXY_SECRET not set in environment variables");
      return NextResponse.json(
        { success: false, error: "Server misconfiguration: missing PROXY_SECRET" },
        { status: 500 }
      );
    }

    const proxyRes = await fetch("https://proxy.csatspl.com/api/syncorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Proxy-Secret": proxySecret,
      },
      body: JSON.stringify(body),
    });

    // Handle non-JSON responses (e.g. "Unauthorized" plain text)
    const contentType = proxyRes.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await proxyRes.text();
      console.error("[NEXT API] Proxy returned non-JSON:", proxyRes.status, text);
      return NextResponse.json(
        { success: false, error: `Proxy error ${proxyRes.status}: ${text}` },
        { status: proxyRes.status }
      );
    }

    const data = await proxyRes.json();
    return NextResponse.json(data, { status: proxyRes.status });
  } catch (error) {
    console.error("[NEXT API] Proxy forward error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Proxy forwarding failed" },
      { status: 502 }
    );
  }
}
