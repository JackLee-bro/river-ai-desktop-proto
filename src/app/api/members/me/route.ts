import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "";

export async function GET(request: Request) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { result: false, errorMsg: "API_BASE_URL is not configured" },
      { status: 500 },
    );
  }

  const upstream = `${API_BASE_URL}/members/me`;
  const cookie = request.headers.get("cookie") ?? "";
  const authorization = request.headers.get("authorization") ?? "";

  const response = await fetch(upstream, {
    method: "GET",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(authorization ? { authorization } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }
    return NextResponse.json(
      {
        result: false,
        errorMsg: detail || "Failed to check session",
      },
      { status: response.status },
    );
  }

  const data = (await response.json()) as Record<string, unknown>;
  return NextResponse.json(data);
}
