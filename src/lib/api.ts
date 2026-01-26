import type { Station, StationsResponse } from "./types";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "";

export const fetchStations = async (page = 1, size = 10) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  const response = await fetch(`${API_BASE_URL}/stations?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch stations");
  }
  const data = (await response.json()) as StationsResponse & {
    rows?: StationsResponse["stations"];
  };
  if (!Array.isArray(data.stations) && Array.isArray(data.rows)) {
    return { ...data, stations: data.rows };
  }
  return data;
};

export const fetchStationsSearch = async (
  keyword: string,
  page = 1,
  size = 10,
) => {
  const params = new URLSearchParams({
    keyword,
    page: String(page),
    size: String(size),
  });
  const response = await fetch(
    `${API_BASE_URL}/stations/search?${params.toString()}`,
    {
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch stations");
  }
  const data = (await response.json()) as StationsResponse & {
    rows?: StationsResponse["stations"];
  };
  if (!Array.isArray(data.stations) && Array.isArray(data.rows)) {
    return { ...data, stations: data.rows };
  }
  return data;
};

export const fetchStationDetail = async (codeNumber: string) => {
  const encoded = encodeURIComponent(codeNumber);
  const url = `${API_BASE_URL}/stations/${encoded}`;
  const response = await fetch(url, {
    cache: "no-store",
  });
  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }
    const suffix = detail ? ` - ${detail.slice(0, 200)}` : "";
    throw new Error(
      `Failed to fetch station detail (${response.status}) from ${url}${suffix}`,
    );
  }
  return (await response.json()) as Station;
};
