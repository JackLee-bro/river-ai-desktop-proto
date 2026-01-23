"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { stations } from "./_data/stations";
import {
  mergeStations,
  readStoredStations,
} from "./_data/stationsStorage";

const stationCoverImages = [
  "/stations/covers/image01.png",
  "/stations/covers/image02.png",
  "/stations/covers/image07.png",
  "/stations/covers/image08.png",
  "/stations/covers/image09.png",
  "/stations/covers/image13.png",
  "/stations/covers/image14.png",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [page, setPage] = useState(1);
  const [storedStations, setStoredStations] = useState(stations);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredSuggestionIndex, setHoveredSuggestionIndex] = useState(-1);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const pageSize = 6;

  useEffect(() => {
    const loadStations = async () => {
      setIsLoading(true);
      // TODO: replace with API call when available.
      const stored = readStoredStations();
      setStoredStations(mergeStations(stations, stored));
      setIsLoading(false);
    };
    void loadStations();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

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

  useEffect(() => {
    setActiveSuggestionIndex(-1);
    setHoveredSuggestionIndex(-1);
    setIsSuggestionOpen(Boolean(debouncedQuery.trim()));
  }, [debouncedQuery]);

  const filteredStations = useMemo(() => {
    const keyword = submittedQuery.trim().toLowerCase();
    if (!keyword) {
      return storedStations;
    }
    return storedStations.filter((station) =>
      station.name.toLowerCase().includes(keyword),
    );
  }, [submittedQuery, storedStations]);
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
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                관측소 현황
              </h1>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form
              className="flex w-full flex-col gap-2 sm:w-auto"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedQuery(query);
                setPage(1);
              }}
            >
              <div className="flex w-full gap-3 sm:w-auto">
                <div className="relative w-full sm:w-96">
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
                                onMouseEnter={() => {
                                  setHoveredSuggestionIndex(index);
                                }}
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
            <span className="w-fit rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500">
              {isLoading ? "불러오는 중" : `총 ${filteredStations.length}개`}
            </span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleStations.map((station, index) => {
            const stationCode = String(2022685 + index);
            const fallbackImage =
              stationCoverImages[index % stationCoverImages.length];
            const coverImage =
              station.images.find((image) => image.url)?.url ??
              fallbackImage;

            return (
            <Link
              key={station.id}
              href={`/stations/${station.id}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {station.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    관측소 코드: {stationCode}
                  </p>
                </div>
              </div>
              <div className="relative mt-4 h-48 overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src={coverImage}
                  alt={`${station.name} 표지`}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700">
                  대표 이미지
                </span>
              </div>
            </Link>
          );
          })}
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
      </div>
    </main>
  );
}
