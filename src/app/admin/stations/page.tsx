"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { stations } from "../../_data/stations";
import {
  mergeStations,
  removeStoredStation,
  readStoredStations,
} from "../../_data/stationsStorage";

const stationCoverImages = [
  "/stations/covers/image01.png",
  "/stations/covers/image02.png",
  "/stations/covers/image07.png",
  "/stations/covers/image08.png",
  "/stations/covers/image09.png",
  "/stations/covers/image13.png",
  "/stations/covers/image14.png",
];

export default function AdminStationsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [hoveredSuggestionIndex, setHoveredSuggestionIndex] = useState(-1);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [storedStations, setStoredStations] = useState(stations);
  const searchParams = useSearchParams();
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const stored = readStoredStations();
    setStoredStations(mergeStations(stations, stored));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
    setHoveredSuggestionIndex(-1);
    setIsSuggestionOpen(Boolean(debouncedQuery.trim()));
  }, [debouncedQuery]);

  useEffect(() => {
    const highlight = searchParams.get("highlight");
    setHighlightId(highlight);
  }, [searchParams]);

  useEffect(() => {
    if (!highlightId) {
      return;
    }
    const timer = window.setTimeout(() => {
      setHighlightId(null);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [highlightId]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => {
      setNotice("");
    }, 800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!highlightId) {
      return;
    }
    if (query) {
      setQuery("");
      setSubmittedQuery("");
      setIsSuggestionOpen(false);
    }
    const index = storedStations.findIndex(
      (station) => station.id === highlightId,
    );
    if (index < 0) {
      return;
    }
    const nextPage = Math.floor(index / pageSize) + 1;
    setPage(nextPage);
  }, [highlightId, pageSize, query, storedStations]);

  useEffect(() => {
    if (highlightId) {
      return;
    }
    const pageParam = Number.parseInt(
      searchParams.get("page") ?? "",
      10,
    );
    if (!Number.isNaN(pageParam) && pageParam > 0) {
      setPage(pageParam);
    }
  }, [highlightId, searchParams]);

  const filteredStations = useMemo(() => {
    const keyword = submittedQuery.trim().toLowerCase();
    if (!keyword) {
      return storedStations;
    }
    return storedStations.filter((station) =>
      station.name.toLowerCase().includes(keyword),
    );
  }, [submittedQuery, storedStations]);

  const suggestedStations = useMemo(() => {
    const keyword = debouncedQuery.trim().toLowerCase();
    if (!keyword) {
      return [];
    }
    return storedStations
      .filter((station) =>
        station.name.toLowerCase().includes(keyword),
      )
      .slice(0, 5);
  }, [debouncedQuery, storedStations]);

  const handleDelete = (id: string) => {
    const target = storedStations.find((station) => station.id === id);
    setPendingDelete({
      id,
      name: target?.name ?? "관측소",
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) {
      return;
    }
    removeStoredStation(pendingDelete.id);
    const stored = readStoredStations();
    setStoredStations(mergeStations(stations, stored));
    setNotice("삭제되었습니다.");
    setPendingDelete(null);
  };

  const pageCount = Math.max(
    1,
    Math.ceil(filteredStations.length / pageSize),
  );
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleStations = filteredStations.slice(
    startIndex,
    startIndex + pageSize,
  );

  return (
    <main className="flex flex-col gap-6">
      {notice ? (
        <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-lg">
          {notice}
        </div>
      ) : null}
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          관측소 관리
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          관측소 정보 및 대표 이미지 설정을 관리하세요.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form
            className="flex w-full flex-col gap-2 sm:w-auto"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedQuery(query);
              setPage(1);
              setIsSuggestionOpen(false);
            }}
          >
            <div className="flex w-full gap-3 sm:w-auto">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="관측소 검색"
                  value={query}
                  onChange={(event) => {
                    const value = event.target.value;
                    setQuery(value);
                    if (!value.trim()) {
                      setSubmittedQuery("");
                      setPage(1);
                    }
                    setIsSuggestionOpen(Boolean(value.trim()));
                  }}
                  onKeyDown={(event) => {
                    if (suggestedStations.length === 0) {
                      return;
                    }
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveSuggestionIndex((prev) =>
                        prev < suggestedStations.length - 1 ? prev + 1 : 0,
                      );
                      return;
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveSuggestionIndex((prev) =>
                        prev > 0 ? prev - 1 : suggestedStations.length - 1,
                      );
                      return;
                    }
                    if (event.key === "Enter") {
                      if (activeSuggestionIndex >= 0) {
                        event.preventDefault();
                        const selected =
                          suggestedStations[activeSuggestionIndex];
                        if (selected) {
                          setQuery(selected.name);
                          setSubmittedQuery(selected.name);
                          setPage(1);
                          setActiveSuggestionIndex(-1);
                          setIsSuggestionOpen(false);
                        }
                      }
                    }
                    if (event.key === "Escape") {
                      setActiveSuggestionIndex(-1);
                      setIsSuggestionOpen(false);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                />
                {isSuggestionOpen ? (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {suggestedStations.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400">
                        추천 검색어가 없습니다.
                      </div>
                    ) : (
                      <ul className="max-h-56 overflow-auto py-1 text-sm text-slate-700">
                        {suggestedStations.map((station, index) => (
                          <li key={`suggest-${station.id}`}>
                            <button
                              type="button"
                              onClick={() => {
                                setQuery(station.name);
                                setSubmittedQuery(station.name);
                                setPage(1);
                                setActiveSuggestionIndex(-1);
                                setIsSuggestionOpen(false);
                              }}
                              onMouseEnter={() =>
                                setHoveredSuggestionIndex(index)
                              }
                              onMouseLeave={() =>
                                setHoveredSuggestionIndex(-1)
                              }
                              className={
                                activeSuggestionIndex === index ||
                                hoveredSuggestionIndex === index
                                  ? "flex w-full items-center gap-2 bg-slate-50 px-3 py-2 text-left"
                                  : "flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                              }
                            >
                              <span className="font-medium text-slate-900">
                                {station.name}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                검색
              </button>
            </div>
          </form>
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-fit rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500">
              총 {filteredStations.length}개
            </span>
            <Link
              href="/admin/stations/new"
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              관측소 등록
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleStations.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            visibleStations.map((station, index) => {
              const fallbackImage =
                stationCoverImages[
                  (startIndex + index) % stationCoverImages.length
                ];
              const coverImage =
                station.images.find((image) => image.url)?.url ??
                fallbackImage;
              return (
                <div
                  key={station.id}
                  className={`rounded-2xl border p-4 transition ${
                    highlightId === station.id
                      ? "border-blue-300 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="relative h-36 overflow-hidden rounded-xl bg-slate-200">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={`${station.name} 대표 이미지`}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700">
                      대표 이미지
                    </span>
                  </div>
                  <div className="mt-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {station.name}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 text-xs">
                    <Link
                      href={`/admin/stations/${station.id}/edit?fromPage=${currentPage}`}
                      className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
                    >
                      편집
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(station.id)}
                      className="rounded-full bg-rose-500 px-3 py-1 text-white"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <footer className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="text-xs font-semibold text-slate-900 disabled:opacity-40"
            disabled={currentPage === 1}
          >
            이전
          </button>
          {Array.from({ length: pageCount }, (_, index) => {
            const pageNumber = index + 1;
            const isActive = pageNumber === currentPage;
            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={
                  isActive
                    ? "rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white"
                    : "rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-900"
                }
              >
                {pageNumber}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() =>
              setPage((prev) => Math.min(pageCount, prev + 1))
            }
            className="text-xs font-semibold text-slate-900 disabled:opacity-40"
            disabled={currentPage === pageCount}
          >
            다음
          </button>
        </div>
      </footer>
      {pendingDelete ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              관측소 삭제
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {pendingDelete.name}
              </span>
              를 삭제할까요? 삭제하면 복구할 수 없습니다.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
