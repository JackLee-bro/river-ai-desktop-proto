"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { journalEntries } from "../_data/journals";

export default function JournalPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const router = useRouter();
  const searchParams = useSearchParams();

  const filteredEntries = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return journalEntries;
    }
    return journalEntries.filter((entry) =>
      entry.title.toLowerCase().includes(keyword),
    );
  }, [query]);
  const pageCount = Math.max(
    1,
    Math.ceil(filteredEntries.length / pageSize),
  );
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const entries = filteredEntries.slice(startIndex, startIndex + pageSize);

  const resetPage = () => setPage(1);

  useEffect(() => {
    const param = searchParams.get("page");
    const nextPage = param ? Number(param) : 1;
    if (!Number.isNaN(nextPage)) {
      setPage(Math.min(Math.max(nextPage, 1), pageCount));
    }
  }, [searchParams, pageCount]);

  const updatePage = (nextPage: number) => {
    const bounded = Math.min(Math.max(nextPage, 1), pageCount);
    setPage(bounded);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(bounded));
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    router.replace(`/journal?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const param = searchParams.get("q") ?? "";
    if (param && param !== query) {
      setQuery(param);
    }
  }, [searchParams, query]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                일지 목록
              </h1>
            </div>
            <Link
              href="/journal/new"
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-blue-700"
            >
              + 등록
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full gap-3 sm:w-auto">
              <input
                type="text"
                placeholder="제목, 내용을 입력하세요."
                value={query}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setQuery(nextValue);
                  resetPage();
                  const params = new URLSearchParams(searchParams.toString());
                  if (nextValue.trim()) {
                    params.set("q", nextValue.trim());
                  } else {
                    params.delete("q");
                  }
                  params.set("page", "1");
                  router.replace(`/journal?${params.toString()}`, {
                    scroll: false,
                  });
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
              총 {filteredEntries.length}건
            </span>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[80px_minmax(0,1fr)_140px_140px] border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span>No</span>
            <span>제목</span>
            <span>작성자</span>
            <span>일자</span>
          </div>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[80px_minmax(0,1fr)_140px_140px] items-center border-b border-slate-100 px-4 py-3 text-sm text-slate-700 last:border-b-0"
            >
              <span className="text-slate-500">{entry.id}</span>
              <Link
                href={`/journal/${entry.id}?page=${currentPage}`}
                className="font-medium text-slate-900 hover:underline"
              >
                {entry.title}
              </Link>
              <span className="text-slate-500">{entry.author}</span>
              <span className="text-slate-500">{entry.date}</span>
            </div>
          ))}
        </section>

        <footer className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => updatePage(currentPage - 1)}
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
                  onClick={() => updatePage(pageNumber)}
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
              onClick={() => updatePage(currentPage + 1)}
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
