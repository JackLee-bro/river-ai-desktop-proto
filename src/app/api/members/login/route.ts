import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "";

export async function POST(request: Request) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { result: false, errorMsg: "API_BASE_URL is not configured" },
      { status: 500 },
    );
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const response = await fetch(`${API_BASE_URL}/members/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
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
        errorMsg: detail || "Failed to login",
      },
      { status: response.status },
    );
  }

  const data = (await response.json()) as Record<string, unknown>;
  const next = NextResponse.json(data);
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    next.headers.set("set-cookie", setCookie);
  }
  return next;
}
