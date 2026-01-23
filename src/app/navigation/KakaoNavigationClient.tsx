"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

import { stations } from "../_data/stations";
type Stop = {
  id: string;
  keyword: string;
  placeName?: string;
  position?: { lat: number; lng: number };
};

const MAX_STOPS = 7;
const DEFAULT_CENTER = { lat: 35.1796, lng: 129.0756 };

const createStop = (id: string): Stop => ({
  id,
  keyword: "",
});

const buildStopsFromParam = (param: string) => {
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
    const matched = stations.find((station) => station.name === name);
    const isLast = index === limited.length - 1;
    return {
      id: isLast ? "end" : `stop-${index}-${Date.now()}`,
      keyword: name,
      placeName: matched?.name ?? name,
      position: matched
        ? { lat: matched.coords[0], lng: matched.coords[1] }
        : undefined,
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
    const param = searchParams.get("stops");
    if (!param) {
      return;
    }
    const nextStops = buildStopsFromParam(param);
    if (!nextStops) {
      return;
    }
    setStops(nextStops);
    setActiveMessage("일지에서 선택한 경로를 불러왔습니다.");
  }, [searchParams]);

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

    try {
      // TODO: replace with API call when available.
      const query = encodeURIComponent(keyword);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      );
      const data = (await response.json()) as {
        display_name: string;
        lat: string;
        lon: string;
      }[];
      if (!data.length) {
        setActiveMessage("검색 결과가 없습니다.");
        return;
      }

      const first = data[0];
      const lat = Number(first.lat);
      const lng = Number(first.lon);
      setStops((prev) =>
        prev.map((item) =>
          item.id === stop.id
            ? {
              ...item,
              placeName: first.display_name,
              position: { lat, lng },
            }
            : item,
        ),
      );
      setActiveMessage("지도에 위치를 표시했습니다.");
    } catch {
      setActiveMessage("검색 중 오류가 발생했습니다.");
    }
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

  const handleRoute = () => {
    const url =
      "https://map.kakao.com/link/by/car/현재위치,37.566826,126.978656/경유1,37.570000,126.992000/경유2,36.350400,127.384500/경유3,35.179600,129.075600/도착지,35.871400,128.601400";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const dragIdRef = useRef<string | null>(null);

  const handleDragStart = (id: string) => {
    dragIdRef.current = id;
  };

  const handleDrop = (id: string) => {
    const dragId = dragIdRef.current;
    if (!dragId || dragId === id) {
      dragIdRef.current = null;
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
                    className="rounded-xl border border-slate-200"
                    draggable
                    onDragStart={() => handleDragStart(stop.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(stop.id)}
                  >
                    <div className="flex items-center gap-2 px-3 py-3">
                      <span className="cursor-grab text-slate-300">↕</span>
                      <input
                        type="text"
                        value={stop.keyword}
                        onChange={(event) =>
                          updateStopKeyword(stop.id, event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleSearch(stop);
                          }
                        }}
                        placeholder={`${label} 입력`}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      />
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
                    {stop.placeName && (
                      <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                        선택: {stop.placeName}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">최적 경로 (임시)</p>
              <p className="mt-2">{previewText}</p>
              <p className="mt-2 text-[11px] text-slate-500">
                지도/DB/API 확정 후 거리 기반 최적화 연결
              </p>
            </div>

            <button
              type="button"
              onClick={handleRoute}
              className="mt-4 w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              경로 보기
            </button>

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

type LeafletMapProps = {
  stops: Stop[];
};

const createStopIcon = (label: string, badge: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;font-family:Arial,Helvetica,sans-serif;">
        <div style="background:rgba(255,255,255,0.95);border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:4px 8px;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.12);max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${label}
        </div>
        <div style="margin-top:4px;background:rgba(0,0,0,0.55);color:#fff;border-radius:999px;padding:2px 8px;font-size:10px;font-weight:800;">
          ${badge}
        </div>
        <div style="margin-top:2px;font-size:24px;line-height:1;">📍</div>
      </div>
    `,
    iconAnchor: [12, 36],
  });

function FitBounds({ stops }: LeafletMapProps) {
  const map = useMap();

  useEffect(() => {
    const points = stops
      .map((stop) => stop.position)
      .filter((position): position is { lat: number; lng: number } => !!position)
      .map((position) => [position.lat, position.lng] as [number, number]);

    if (points.length === 0) {
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 12);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    map.fitBounds(points, { padding: [30, 30] });
  }, [map, stops]);

  return null;
}

function LeafletMap({ stops }: LeafletMapProps) {
  const markers = stops
    .map((stop, index) => ({ stop, index }))
    .filter(({ stop }) => stop.position);

  return (
    <MapContainer
      center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
      zoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <CircleMarker
        center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
        radius={10}
        pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.35 }}
      />
      {markers.map(({ stop, index }) => {
        const badge =
          index === 0
            ? "출발"
            : index === stops.length - 1
              ? "도착"
              : `경유${index}`;
        const label = stop.placeName ?? stop.keyword ?? "선택된 위치";
        return (
          <Marker
            key={stop.id}
            position={[stop.position!.lat, stop.position!.lng]}
            icon={createStopIcon(label, badge)}
          />
        );
      })}
      <FitBounds stops={stops} />
    </MapContainer>
  );
}

declare global {
  interface Window {
    kakao: any;
  }
}
