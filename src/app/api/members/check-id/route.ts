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

  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId")?.trim() ?? "";
  if (!memberId) {
    return NextResponse.json(
      { result: false, errorMsg: "memberId is required" },
      { status: 400 },
    );
  }

  const upstream = new URL(`${API_BASE_URL}/members/check-id`);
  upstream.searchParams.set("memberId", memberId);

  const response = await fetch(upstream.toString(), { cache: "no-store" });
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
        errorMsg: detail || "Failed to check member id",
      },
      { status: response.status },
    );
  }

  const data = (await response.json()) as { result?: boolean; errorMsg?: string | null };
  return NextResponse.json(data);
}
