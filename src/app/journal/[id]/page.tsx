"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import MapView, { type MapPoint } from "../../_components/MapView";
import { journalEntries, type JournalEntry } from "../../_data/journals";
import { stations } from "../../_data/stations";

export default function JournalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const entryId =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
  const [storedEntries, setStoredEntries] = useState<JournalEntry[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [activePhoto, setActivePhoto] =
    useState<JournalEntry["photos"][number] | null>(null);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("journalEntries");
      if (!stored) {
        setStoredEntries([]);
        setIsStorageLoaded(true);
        return;
      }
      const parsed = JSON.parse(stored) as JournalEntry[];
      setStoredEntries(parsed);
    } catch {
      setStoredEntries([]);
    } finally {
      setIsStorageLoaded(true);
    }
  }, []);

  const entry = useMemo(() => {
    if (!entryId) {
      return null;
    }
    const dummyEntry = journalEntries.find((item) => item.id === entryId);
    if (dummyEntry) {
      return dummyEntry;
    }
    const storedEntry = storedEntries.find((item) => item.id === entryId);
    return storedEntry ?? null;
  }, [entryId, storedEntries]);
  const isStoredEntry = storedEntries.some((item) => item.id === entryId);

  if (!entry) {
    if (!isStorageLoaded || !entryId) {
      return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
            <header className="rounded-2xl bg-white p-5 shadow-sm">
              <h1 className="text-2xl font-semibold text-slate-900">
                일지를 불러오는 중입니다.
              </h1>
            </header>
          </div>
        </main>
      );
    }
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <header className="rounded-2xl bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">
              일지를 찾을 수 없습니다.
            </h1>
          </header>
          <Link
            href="/journal"
            className="w-fit rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
          >
            목록으로
          </Link>
        </div>
      </main>
    );
  }

  const handleDelete = () => {
    if (!isStoredEntry) {
      alert("더미 데이터는 삭제할 수 없습니다.");
      return;
    }
    const confirmed = window.confirm("이 일지를 삭제할까요?");
    if (!confirmed) {
      return;
    }
    const nextEntries = storedEntries.filter(
      (item) => item.id !== entryId,
    );
    try {
      localStorage.setItem("journalEntries", JSON.stringify(nextEntries));
    } catch {
      // Ignore storage errors and proceed with navigation.
    }
    router.push("/journal");
  };

  const handleOpenNavigation = () => {
    const stops = entry.stations ?? [];
    if (stops.length === 0) {
      alert("등록된 관측소가 없습니다.");
      return;
    }
    const stopParam = stops
      .map((name) => encodeURIComponent(name))
      .join("|");
    router.push(`/navigation?stops=${stopParam}`);
  };

  const stationPoints: MapPoint[] = entry.stations
    .map((name) => {
      const matched = stations.find((station) => station.name === name);
      if (!matched) {
        return null;
      }
      return {
        id: matched.id,
        label: matched.name,
        position: matched.coords,
        kind: "station",
      } satisfies MapPoint;
    })
    .filter((value): value is MapPoint => value !== null);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">
            일지 상세
          </h1>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.5fr_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {entry.date}
                </span>
                <span>작성자: {entry.author}</span>
              </div>
              <div className="mt-2 text-sm text-slate-600">
                제목:{" "}
                <span className="font-semibold text-slate-900">
                  {entry.title}
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-2 rounded-xl border border-slate-100 px-4 py-4 text-sm text-slate-700">
              {entry.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {entry.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={photo.label}
                      onClick={() => setActivePhoto(photo)}
                      className="h-24 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center text-xs font-semibold text-slate-400">
                      {photo.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/journal"
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
              >
                목록으로
              </Link>
              <Link
                href={`/journal/new?id=${entry.id}`}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                수정
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
              >
                삭제
              </button>
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">
                관측소 위치
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                <span className="text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="관측소 검색(최대 6개)"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
              <div className="mt-3 space-y-2">
                {entry.stations.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      className="text-xs text-slate-400"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleOpenNavigation}
                className="mt-4 w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                경로 보기
              </button>
            </div>

            <div className="min-h-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <MapView points={stationPoints} height={240} />
            </div>
          </aside>
        </section>
      </div>
      {activePhoto ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/70 p-4"
          onClick={() => {
            setActivePhoto(null);
            setIsPhotoZoomed(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">
                {activePhoto.label}
              </p>
              <button
                type="button"
                onClick={() => {
                  setActivePhoto(null);
                  setIsPhotoZoomed(false);
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                닫기
              </button>
            </div>
            {activePhoto.url ? (
              <div className="max-h-[80vh] w-full overflow-auto bg-black/5">
                <img
                  src={activePhoto.url}
                  alt={activePhoto.label}
                  onClick={() => setIsPhotoZoomed((prev) => !prev)}
                  className={
                    isPhotoZoomed
                      ? "h-auto w-full cursor-zoom-out select-none object-contain transition-transform"
                      : "h-auto w-full cursor-zoom-in select-none object-contain transition-transform"
                  }
                  style={isPhotoZoomed ? { transform: "scale(1.6)" } : undefined}
                />
              </div>
            ) : (
              <div className="flex h-[60vh] items-center justify-center text-sm text-slate-500">
                이미지를 표시할 수 없습니다.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
