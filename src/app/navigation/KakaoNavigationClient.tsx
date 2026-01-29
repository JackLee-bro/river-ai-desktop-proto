"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

type Stop = {
  id: string;
  keyword: string;
  placeName?: string;
  position?: { lat: number; lng: number };
};

type StationMeta = {
  name: string;
  coords: [number, number];
};

type StationSuggestion = {
  id: string;
  name: string;
  coords: [number, number];
  codeNumber?: string | number;
};

type ApiStation = {
  id?: string;
  name?: string;
  stationName?: string;
  codeName?: string | number;
  codeNumber?: string | number;
  coords?: [number, number];
  latitude?: string | number;
  longitude?: string | number;
  lat?: string | number;
  lng?: string | number;
};

const MAX_STOPS = 7;
const LeafletMap = dynamic(() => import("./LeafletMapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
      지도를 불러오는 중...
    </div>
  ),
});

const createStop = (id: string): Stop => ({
  id,
  keyword: "",
});

const normalizeName = (value: string) => value.trim().toLowerCase();

const getStationLabel = (station: ApiStation) =>
  station.stationName ?? station.name ?? "";

const getStationCode = (station: ApiStation) =>
  station.codeName ?? station.codeNumber ?? station.id;

const parseNumber = (value: string | number | undefined) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const sanitized = value.replace(/,/g, "").trim();
    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extractCoords = (station: ApiStation): [number, number] | undefined => {
  if (
    Array.isArray(station.coords) &&
    station.coords.length >= 2 &&
    Number.isFinite(station.coords[0]) &&
    Number.isFinite(station.coords[1])
  ) {
    const first = station.coords[0];
    const second = station.coords[1];
    if (Math.abs(first) > 90 && Math.abs(second) <= 90) {
      return [second, first];
    }
    return [first, second];
  }
  const latRaw = parseNumber(station.latitude ?? station.lat);
  const lngRaw = parseNumber(station.longitude ?? station.lng);
  if (latRaw === null || lngRaw === null) {
    return undefined;
  }
  if (Math.abs(latRaw) > 90 && Math.abs(lngRaw) <= 90) {
    return [lngRaw, latRaw];
  }
  return [latRaw, lngRaw];
};

const fetchStationDetailByCodeNumber = async (codeNumber: string | number) => {
  const encoded = encodeURIComponent(String(codeNumber));
  const response = await fetch(`/api/stations/${encoded}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as ApiStation;
};

const resolveStationByName = async (keyword: string) => {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const params = new URLSearchParams({
      keyword: trimmed,
      page: "1",
      size: "5",
    });
    const response = await fetch(`/api/stations/search?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { stations?: ApiStation[] };
    const list = Array.isArray(data.stations) ? data.stations : [];
    if (list.length === 0) {
      return null;
    }
    const normalized = normalizeName(trimmed);
    const matched =
      list.find((station) => normalizeName(getStationLabel(station)) === normalized) ??
      list[0];
    const matchedName = getStationLabel(matched).trim();
    if (!matchedName || !matched.codeNumber) {
      return null;
    }
    let coords = extractCoords(matched);
    if (!coords) {
      const detail = await fetchStationDetailByCodeNumber(matched.codeNumber);
      if (detail) {
        coords = extractCoords(detail) ?? coords;
      }
    }
    if (!coords) {
      return null;
    }
    return { name: matchedName, coords };
  } catch {
    return null;
  }
};

const resolveAddressFromCoords = async (lat: number, lng: number) => {
  const key = process.env.NEXT_PUBLIC_VWORLD_KEY ?? "";
  if (!key) {
    return null;
  }
  try {
    const params = new URLSearchParams({
      service: "address",
      request: "getAddress",
      version: "2.0",
      format: "json",
      type: "ROAD",
      crs: "epsg:4326",
      point: `${lng},${lat}`,
      key,
    });
    const response = await fetch(
      `https://api.vworld.kr/req/address?${params.toString()}`,
    );
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as {
      response?: { result?: Array<{ text?: string }> };
    };
    const text = data.response?.result?.[0]?.text?.trim();
    return text || null;
  } catch {
    return null;
  }
};

const readNavigationStationMeta = (): StationMeta[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = localStorage.getItem("navigation-station-meta");
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as StationMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const buildStopsFromParam = (
  param: string,
  metaList: StationMeta[] = [],
) => {
  const metaByName = metaList.reduce<Record<string, StationMeta>>(
    (acc, meta) => {
      acc[meta.name] = meta;
      return acc;
    },
    {},
  );
  const names = param
    .split("|")
    .map((value) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    })
    .map((value) => value.trim())
    .filter(Boolean);
  if (names.length === 0) {
    return null;
  }
  const limited = names.slice(0, Math.max(0, MAX_STOPS - 1));
  const startStop = createStop("start");
  const nextStops = limited.map((name, index) => {
    const meta = metaByName[name];
    const isLast = index === limited.length - 1;
    return {
      id: isLast ? "end" : `stop-${index}-${Date.now()}`,
      keyword: name,
      placeName: meta?.name ?? name,
      position: meta ? { lat: meta.coords[0], lng: meta.coords[1] } : undefined,
    } satisfies Stop;
  });
  return [startStop, ...nextStops];
};

const loadKakaoMapScript = (appKey: string) =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (window.kakao?.maps) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error("카카오맵 스크립트 로드 실패"));
    document.head.appendChild(script);
  });

export default function KakaoNavigationClient() {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";
  const hasKey = appKey.trim().length > 0;
  const searchParams = useSearchParams();
  const [stops, setStops] = useState<Stop[]>([
    createStop("start"),
    createStop("end"),
  ]);
  const [activeMessage, setActiveMessage] = useState("");
  const [kakaoReady, setKakaoReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [stationSuggestions, setStationSuggestions] = useState<StationSuggestion[]>([]);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [suggestKeyword, setSuggestKeyword] = useState("");
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const resolvingStopsRef = useRef<Set<string>>(new Set());
  const suggestionRef = useRef<HTMLDivElement | null>(null);

  const placesRef = useRef<any>(null);

  const stopCount = stops.length;
  const previewText = useMemo(() => {
    const items = stops
      .map((stop) => stop.placeName ?? stop.keyword)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    if (items.length === 0) {
      return "출발지/도착지 입력 후 경로가 표시됩니다.";
    }
    return items.join(" -> ");
  }, [stops]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!locationError) return;
    const timer = window.setTimeout(() => setLocationError(""), 1600);
    return () => window.clearTimeout(timer);
  }, [locationError]);


  useEffect(() => {
    if (!isSuggestionOpen || !activeStopId) {
      return;
    }
    const stop = stops.find((item) => item.id === activeStopId);
    const keyword = stop?.keyword.trim() ?? "";
    if (!keyword) {
      setStationSuggestions([]);
      setActiveSuggestionIndex(-1);
      setIsSuggestLoading(false);
      setSuggestKeyword("");
      return;
    }
    if (keyword !== suggestKeyword) {
      setActiveSuggestionIndex(-1);
      setSuggestKeyword(keyword);
    }
    const controller = new AbortController();
    setIsSuggestLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ stationName: keyword });
        const response = await fetch(
          `/api/stations/by-name?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          setStationSuggestions([]);
          return;
        }
        const data = (await response.json()) as { rows?: ApiStation[] };
        const rows = Array.isArray(data.rows) ? data.rows : [];
        const nextSuggestions = rows
          .map((station) => {
            const name = getStationLabel(station).trim();
            const coords = extractCoords(station);
            if (!name || !coords) {
              return null;
            }
            const id = getStationCode(station) ?? name;
            return {
              id: String(id),
              name,
              coords,
              codeNumber: getStationCode(station),
            } satisfies StationSuggestion;
          })
          .filter((value): value is StationSuggestion => value !== null);
        setStationSuggestions(nextSuggestions);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setStationSuggestions([]);
        }
      } finally {
        setIsSuggestLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeStopId, isSuggestionOpen, stops]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!suggestionRef.current) return;
      if (!suggestionRef.current.contains(event.target as Node)) {
        setIsSuggestionOpen(false);
        setActiveSuggestionIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const param = searchParams.get("stops");
    if (!param) {
      return;
    }
    const metaList = readNavigationStationMeta();
    const nextStops = buildStopsFromParam(param, metaList);
    if (!nextStops) {
      return;
    }
    setStops(nextStops);
    setActiveMessage("일지에서 선택한 경로를 불러왔습니다.");
    if (metaList.length > 0) {
      try {
        localStorage.removeItem("navigation-station-meta");
      } catch {
        // Ignore storage errors.
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const targets = stops.filter(
      (stop) =>
        stop.keyword.trim().length > 0 &&
        !stop.position &&
        !resolvingStopsRef.current.has(stop.id),
    );
    if (targets.length === 0) {
      return;
    }
    targets.forEach((stop) => {
      resolvingStopsRef.current.add(stop.id);
      void (async () => {
        const resolved = await resolveStationByName(stop.keyword);
        if (!resolved) {
          return;
        }
        setStops((prev) =>
          prev.map((item) =>
            item.id === stop.id
              ? {
                ...item,
                placeName: resolved.name,
                position: { lat: resolved.coords[0], lng: resolved.coords[1] },
              }
              : item,
          ),
        );
      })();
    });
  }, [stops]);

  useEffect(() => {
    if (!hasKey) {
      setKakaoReady(false);
      return;
    }

    loadKakaoMapScript(appKey)
      .then(() => {
        placesRef.current = new window.kakao.maps.services.Places();
        setKakaoReady(true);
      })
      .catch(() => {
        setKakaoReady(false);
        setActiveMessage("카카오맵 검색을 사용할 수 없습니다.");
      });
  }, [appKey, hasKey]);

  const updateStopKeyword = (id: string, keyword: string) => {
    setStops((prev) =>
      prev.map((stop) =>
        stop.id === id
          ? {
            ...stop,
            keyword,
            placeName: undefined,
            position: undefined,
          }
          : stop,
      ),
    );
  };

  const handleSearch = async (stop: Stop) => {
    const keyword = stop.keyword.trim();
    if (!keyword) {
      setActiveMessage("검색어를 입력해주세요.");
      return;
    }

    if (kakaoReady && placesRef.current) {
      placesRef.current.keywordSearch(
        keyword,
        (data: any, status: any) => {
          if (
            status !== window.kakao.maps.services.Status.OK ||
            data.length === 0
          ) {
            setActiveMessage("검색 결과가 없습니다.");
            return;
          }

          const first = data[0];
          const lat = Number(first.y);
          const lng = Number(first.x);

          setStops((prev) =>
            prev.map((item) =>
              item.id === stop.id
                ? {
                  ...item,
                  placeName: first.place_name,
                  position: { lat, lng },
                }
                : item,
            ),
          );
          setActiveMessage(`${first.place_name} 위치를 표시했습니다.`);
        },
      );
      return;
    }

    setActiveMessage("지도 검색 서비스를 사용할 수 없습니다.");
  };

  const applySuggestion = (stopId: string, suggestion: StationSuggestion) => {
    setStops((prev) =>
      prev.map((stop) =>
        stop.id === stopId
          ? {
            ...stop,
            keyword: suggestion.name,
            placeName: suggestion.name,
            position: { lat: suggestion.coords[0], lng: suggestion.coords[1] },
          }
          : stop,
      ),
    );
    setIsSuggestionOpen(false);
    setActiveSuggestionIndex(-1);
    setStationSuggestions([]);
  };

  const handleAddStop = () => {
    if (stops.length >= MAX_STOPS) {
      setActiveMessage(`최대 ${MAX_STOPS}개까지 가능합니다.`);
      return;
    }

    setStops((prev) => {
      const next = [...prev];
      const insertIndex = Math.max(0, next.length - 1);
      next.splice(
        insertIndex,
        0,
        createStop(`stop-${Date.now()}`),
      );
      return next;
    });
  };

  const handleRemoveStop = (id: string) => {
    setStops((prev) =>
      prev.length > 2 ? prev.filter((stop) => stop.id !== id) : prev,
    );
  };

  const handleUseCurrentLocation = () => {
    setLocationError("");
    setShowLocationModal(true);
  };

  const confirmUseCurrentLocation = () => {
    setShowLocationModal(false);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const address = await resolveAddressFromCoords(lat, lng);
        const label = address ?? "현재 위치";
        setStops((prev) =>
          prev.map((stop, index) =>
            index === 0
              ? {
                ...stop,
                keyword: label,
                placeName: label,
                position: { lat, lng },
              }
              : stop,
          ),
        );
        setActiveMessage("현재 위치를 출발지로 설정했습니다.");
        setIsLocating(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("위치 접근이 거부되었습니다.");
        } else if (error.code === error.TIMEOUT) {
          setLocationError("위치 확인 시간이 초과되었습니다.");
        } else {
          setLocationError("위치 정보를 불러오지 못했습니다.");
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleRoute = () => {
    const resolved = stops.filter((stop) => stop.position);
    if (resolved.length < 2) {
      setActiveMessage("출발지/도착지 위치를 먼저 확정해주세요.");
      return;
    }
    if (!stops[0].position || !stops[stops.length - 1].position) {
      setActiveMessage("출발지/도착지 위치를 먼저 확정해주세요.");
      return;
    }

    const segments = stops
      .filter((stop) => stop.position)
      .map((stop) => {
        const label = stop.placeName ?? stop.keyword ?? "지점";
        const name = encodeURIComponent(label);
        const lat = stop.position!.lat;
        const lng = stop.position!.lng;
        return `${name},${lat},${lng}`;
      });

    const url = `https://map.kakao.com/link/by/car/${segments.join("/")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const computeOptimalRoute = () => {
    if (stops.length < 2) {
      setActiveMessage("출발지와 도착지를 입력해주세요.");
      return;
    }
    const start = stops[0];
    if (!start.position) {
      setActiveMessage("출발지 위치를 먼저 확정해주세요.");
      return;
    }

    const middle = stops.slice(1, -1);
    const tail = stops.slice(1);
    const withPos = tail.filter((stop) => stop.position);
    const withoutPos = tail.filter((stop) => !stop.position);

    const distance = (
      a: { lat: number; lng: number },
      b: { lat: number; lng: number },
    ) => {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      return 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    };

    if (withPos.length === 0) {
      setActiveMessage("도착지/경유지 위치를 먼저 확정해주세요.");
      return;
    }

    let endStop = withPos[0];
    let maxDistance = -1;
    withPos.forEach((candidate) => {
      const d = distance(start.position!, candidate.position!);
      if (d > maxDistance) {
        maxDistance = d;
        endStop = candidate;
      }
    });

    const remaining = withPos.filter((stop) => stop.id !== endStop.id);
    const ordered: Stop[] = [];
    let current = start;

    while (remaining.length > 0) {
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      remaining.forEach((candidate, index) => {
        const candidatePos = candidate.position!;
        const currentPos = current.position!;
        const d = distance(currentPos, candidatePos);
        if (d < bestDistance) {
          bestDistance = d;
          bestIndex = index;
        }
      });
      const [picked] = remaining.splice(bestIndex, 1);
      ordered.push(picked);
      current = picked;
    }

    const preview = [start, ...ordered, ...withoutPos, endStop];
    setStops(preview);
    if (withoutPos.length > 0) {
      setActiveMessage(
        "좌표 없는 경유지는 최적 경로 계산에서 제외되었습니다.",
      );
    } else {
      setActiveMessage("최적 경로를 계산해 재배열했습니다.");
    }
  };

  const dragIdRef = useRef<string | null>(null);

  const handleDragStart = (id: string) => {
    dragIdRef.current = id;
  };

  const handleDrop = (id: string) => {
    const dragId = dragIdRef.current;
    if (!dragId || dragId === id) {
      dragIdRef.current = null;
      setDragOverId(null);
      return;
    }

    setStops((prev) => {
      const fromIndex = prev.findIndex((stop) => stop.id === dragId);
      const toIndex = prev.findIndex((stop) => stop.id === id);
      if (fromIndex < 0 || toIndex < 0) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });

    dragIdRef.current = null;
    setDragOverId(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-slate-900">
              네비게이션
            </h1>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:max-h-[80vh] lg:overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                출발/경유/도착 (드래그로 순서 변경)
              </p>
              <button
                type="button"
                onClick={handleAddStop}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                추가 ({stopCount}/{MAX_STOPS})
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {stops.map((stop, index) => {
                const isFirst = index === 0;
                const isLast = index === stops.length - 1;
                const label = isFirst ? "출발지" : isLast ? "도착지" : "경유지";

                return (
                  <div
                    key={stop.id}
                    className="relative rounded-xl border border-slate-200"
                    draggable
                    onDragStart={() => handleDragStart(stop.id)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (dragIdRef.current && dragIdRef.current !== stop.id) {
                        setDragOverId(stop.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverId === stop.id) {
                        setDragOverId(null);
                      }
                    }}
                    onDrop={() => handleDrop(stop.id)}
                  >
                    {dragOverId === stop.id ? (
                      <div className="absolute left-3 right-3 top-0 h-0.5 -translate-y-1/2 rounded-full bg-blue-500" />
                    ) : null}
                    <div className="flex items-center gap-3 px-3 py-3">
                      <div className="relative flex h-10 w-6 items-center justify-center">
                        <span
                          className={
                            isFirst
                              ? "h-2.5 w-2.5 rounded-full border-2 border-blue-500 bg-white"
                              : isLast
                                ? "h-2.5 w-2.5 rounded-full border-2 border-rose-500 bg-white"
                                : "h-2 w-2 rounded-full bg-slate-300"
                          }
                        />
                      </div>
                      <span className="cursor-grab text-blue-500">↕</span>
                      <div
                        ref={activeStopId === stop.id ? suggestionRef : null}
                        className="relative w-full"
                      >
                        <input
                          type="text"
                          value={stop.keyword}
                          onChange={(event) => {
                            updateStopKeyword(stop.id, event.target.value);
                            setActiveStopId(stop.id);
                            setIsSuggestionOpen(true);
                          }}
                          onFocus={() => {
                            setActiveStopId(stop.id);
                            setIsSuggestionOpen(true);
                          }}
                          onKeyDown={(event) => {
                            if (!isSuggestionOpen) {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleSearch(stop);
                              }
                              return;
                            }
                            if (event.key === "ArrowDown") {
                              event.preventDefault();
                              if (stationSuggestions.length === 0) return;
                              setActiveSuggestionIndex((prev) =>
                                Math.min(prev + 1, stationSuggestions.length - 1),
                              );
                              return;
                            }
                            if (event.key === "ArrowUp") {
                              event.preventDefault();
                              if (stationSuggestions.length === 0) return;
                              setActiveSuggestionIndex((prev) =>
                                Math.max(prev - 1, 0),
                              );
                              return;
                            }
                            if (event.key === "Enter") {
                              event.preventDefault();
                              if (
                                activeSuggestionIndex >= 0 &&
                                activeSuggestionIndex < stationSuggestions.length
                              ) {
                                applySuggestion(
                                  stop.id,
                                  stationSuggestions[activeSuggestionIndex],
                                );
                              } else {
                                handleSearch(stop);
                              }
                            }
                          }}
                          placeholder={`${label} 입력`}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                        />
                        {isSuggestionOpen &&
                        activeStopId === stop.id &&
                        stationSuggestions.length > 0 ? (
                          <div className="absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-lg">
                            {stationSuggestions.map((item, index) => (
                              <button
                                key={`${item.id}-${index}`}
                                type="button"
                                onClick={() => applySuggestion(stop.id, item)}
                                className={
                                  index === activeSuggestionIndex
                                    ? "block w-full bg-slate-100 px-3 py-2 text-left text-slate-900"
                                    : "block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                                }
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        {isSuggestionOpen &&
                        activeStopId === stop.id &&
                        isSuggestLoading ? (
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                            ...
                          </span>
                        ) : null}
                      </div>
                      {isFirst ? (
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          className="whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          내 위치
                        </button>
                      ) : null}
                      {isLast ? (
                        <button
                          type="button"
                          onClick={handleAddStop}
                          disabled={stopCount >= MAX_STOPS}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-sm text-slate-600 disabled:opacity-40"
                          aria-label="경유지 추가"
                        >
                          +
                        </button>
                      ) : !isFirst ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(stop.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-sm text-slate-600"
                          aria-label="경유지 삭제"
                        >
                          -
                        </button>
                      ) : (
                        <span className="h-8 w-8" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-700">최적 경로</p>
              </div>
              <p className="mt-2">{previewText}</p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={computeOptimalRoute}
                  className="w-full rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                >
                  최적 경로 보기
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleRoute}
                className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                네비게이션 안내
              </button>
            </div>

            {activeMessage && (
              <div className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
                {activeMessage}
              </div>
            )}
          </aside>

          <div className="relative h-[70vh] min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[80vh]">
            {isMounted ? (
              <LeafletMap stops={stops} />
            ) : (
              <MockMap stops={stops} message="지도를 준비 중입니다." />
            )}
          </div>
        </section>
      </div>

      {showLocationModal ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              현재 위치 사용
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              출발지를 설정하기 위해 현재 위치 접근이 필요합니다.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              위치 접근은 브라우저 권한 팝업에서 허용해야 합니다.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmUseCurrentLocation}
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isLocating ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20">
          <div className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-700 shadow-lg">
            현재 위치를 확인 중입니다...
          </div>
        </div>
      ) : null}

      {locationError ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 px-4">
          <div className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-rose-600 shadow-lg">
            {locationError}
          </div>
        </div>
      ) : null}
    </main>
  );
}

type MockMapProps = {
  stops: Stop[];
  message?: string;
};

const mockPositions = [
  { x: 22, y: 28 },
  { x: 62, y: 34 },
  { x: 48, y: 58 },
  { x: 30, y: 70 },
  { x: 70, y: 68 },
  { x: 40, y: 42 },
  { x: 58, y: 78 },
];

function MockMap({ stops, message }: MockMapProps) {
  const visibleStops = stops
    .map((stop) => stop.placeName ?? stop.keyword)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return (
    <div className="relative h-full w-full">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(226,232,240,0.7), rgba(248,250,252,0.95))",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.22) 1px, transparent 0)",
          backgroundSize: "26px 26px",
          opacity: 0.5,
        }}
      />
      <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-sm backdrop-blur">
        Demo Map
      </div>
      <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20">
        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500" />
      </div>
      {visibleStops.slice(0, mockPositions.length).map((label, index) => {
        const position = mockPositions[index];
        const badge =
          index === 0
            ? "출발"
            : index === visibleStops.length - 1
              ? "도착"
              : `경유${index}`;

        return (
          <div
            key={`${label}-${index}`}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="max-w-[140px] truncate rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow">
                {label}
              </div>
              <div className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                {badge}
              </div>
              <div className="text-xl">📍</div>
            </div>
          </div>
        );
      })}
      <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm">
        {message || "카카오 키 없이도 미리보기로 표시됩니다."}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    kakao: any;
  }
}
