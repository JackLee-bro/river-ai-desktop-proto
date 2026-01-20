"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { stations } from "./_data/stations";

const statusTone: Record<string, string> = {
  정상: "bg-emerald-50 text-emerald-700 border-emerald-200",
  점검: "bg-amber-50 text-amber-700 border-amber-200",
  "통신 이상": "bg-rose-50 text-rose-700 border-rose-200",
};

export default function Home() {
  const [query, setQuery] = useState("");

  const filteredStations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return stations;
    }
    return stations.filter((station) =>
      station.name.toLowerCase().includes(keyword),
    );
  }, [query]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
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
                onChange={(event) => setQuery(event.target.value)}
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
          {filteredStations.map((station, index) => {
            const stationCode = String(2022685 + index);

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
              <div className="mt-4 flex h-48 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">
                이미지 영역
              </div>
              <div className="mt-3 text-xs text-slate-500">
                {station.address}
              </div>
            </Link>
          );
          })}
        </section>
      </div>
    </main>
  );
}
