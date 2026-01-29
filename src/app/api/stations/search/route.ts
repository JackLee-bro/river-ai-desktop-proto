import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword")?.trim() ?? "";
  const page = url.searchParams.get("page") ?? "1";
  const size = url.searchParams.get("size") ?? "5";

  if (!keyword) {
    return NextResponse.json({ total: 0, page: 1, size: 0, stations: [] });
  }

  const upstream = new URL(`${API_BASE_URL}/stations/search`);
  upstream.searchParams.set("keyword", keyword);
  upstream.searchParams.set("page", page);
  upstream.searchParams.set("size", size);

  const response = await fetch(upstream.toString(), { cache: "no-store" });
  if (!response.ok) {
    return NextResponse.json(
      { total: 0, page: 1, size: 0, stations: [] },
      { status: response.status },
    );
  }

  const data = (await response.json()) as {
    total?: number;
    page?: number;
    size?: number;
    stations?: unknown[];
    rows?: unknown[];
  };

  const stations = Array.isArray(data.stations)
    ? data.stations
    : Array.isArray(data.rows)
      ? data.rows
      : [];

  return NextResponse.json({
    total: data.total ?? stations.length,
    page: (data.page ?? Number(page)) || 1,
    size: (data.size ?? Number(size)) || stations.length,
    stations,
  });
}
