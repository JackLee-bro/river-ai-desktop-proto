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
  const [page, setPage] = useState(1);
  const [storedStations, setStoredStations] = useState(stations);
  const pageSize = 6;

  useEffect(() => {
    const stored = readStoredStations();
    setStoredStations(mergeStations(stations, stored));
  }, []);

  const filteredStations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return storedStations;
    }
    return storedStations.filter((station) =>
      station.name.toLowerCase().includes(keyword),
    );
  }, [query, storedStations]);
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
            <div className="flex w-full gap-3 sm:w-auto">
              <input
                type="text"
                placeholder="관측소 검색"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 sm:w-96"
              />
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                검색
              </button>
            </div>
            <span className="w-fit rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500">
              총 {filteredStations.length}개
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
