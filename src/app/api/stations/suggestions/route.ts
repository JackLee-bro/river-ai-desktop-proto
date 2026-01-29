import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword")?.trim() ?? "";
  const limit = url.searchParams.get("limit") ?? "5";

  if (!keyword) {
    return NextResponse.json({ suggestions: [] });
  }

  const upstream = new URL(`${API_BASE_URL}/stations/suggestions`);
  upstream.searchParams.set("keyword", keyword);
  upstream.searchParams.set("limit", limit);

  const response = await fetch(upstream.toString(), { cache: "no-store" });
  if (!response.ok) {
    return NextResponse.json({ suggestions: [] }, { status: response.status });
  }
  const data = (await response.json()) as { suggestions?: string[] };
  return NextResponse.json({ suggestions: data.suggestions ?? [] });
}
