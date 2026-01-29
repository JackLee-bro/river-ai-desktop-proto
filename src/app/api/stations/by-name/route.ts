import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "";

export async function GET(request: Request) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { keyword: "", rows: [], errorMsg: "API_BASE_URL is not configured" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const stationName = url.searchParams.get("stationName")?.trim() ?? "";
  const upstream = new URL(`${API_BASE_URL}/stations/by-name`);
  if (stationName) {
    upstream.searchParams.set("stationName", stationName);
  }

  const response = await fetch(upstream.toString(), { cache: "no-store" });
  if (!response.ok) {
    return NextResponse.json(
      { keyword: stationName, rows: [] },
      { status: response.status },
    );
  }

  const data = (await response.json()) as {
    keyword?: string;
    rows?: unknown[];
  };

  return NextResponse.json({
    keyword: data.keyword ?? stationName,
    rows: Array.isArray(data.rows) ? data.rows : [],
  });
}
