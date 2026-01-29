import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "";

export async function GET(
  request: Request,
  context: { params?: { codeNumber?: string } },
) {
  let codeNumber = context.params?.codeNumber ?? "";
  if (!codeNumber) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    codeNumber = parts[parts.length - 1] ?? "";
  }
  if (!codeNumber) {
    return NextResponse.json({ message: "codeNumber is required" }, { status: 400 });
  }
  if (!API_BASE_URL) {
    return NextResponse.json(
      { message: "API_BASE_URL is not configured" },
      { status: 500 },
    );
  }

  const encoded = encodeURIComponent(codeNumber);
  const upstream = `${API_BASE_URL}/stations/${encoded}`;
  const response = await fetch(upstream, { cache: "no-store" });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }
    return NextResponse.json(
      { message: "Failed to fetch station detail", detail },
      { status: response.status },
    );
  }

  const data = (await response.json()) as unknown;
  return NextResponse.json(data);
}
