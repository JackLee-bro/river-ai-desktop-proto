"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { journalEntries, type JournalEntry } from "../_data/journals";

export default function JournalPage() {
  const [storedEntries, setStoredEntries] = useState<JournalEntry[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [hoveredSuggestionIndex, setHoveredSuggestionIndex] = useState(-1);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 10;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const loadEntries = async () => {
      setIsLoading(true);
      // TODO: replace with API call when available.
      try {
        const stored = localStorage.getItem("journalEntries");
        if (!stored) {
          setStoredEntries([]);
          return;
        }
        const parsed = JSON.parse(stored) as JournalEntry[];
        setStoredEntries(parsed);
      } catch {
        setStoredEntries([]);
      } finally {
        setIsLoading(false);
      }
    };
    void loadEntries();
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

  const combinedEntries = useMemo(() => {
    const merged = [...storedEntries, ...journalEntries];
    return merged.sort((a, b) => b.date.localeCompare(a.date));
  }, [storedEntries]);

  const suggestedEntries = useMemo(() => {
    const keyword = debouncedQuery.trim().toLowerCase();
    if (!keyword) {
      return [];
    }
    return combinedEntries
      .filter((entry) =>
        entry.title.toLowerCase().includes(keyword),
      )
      .slice(0, 5);
  }, [combinedEntries, debouncedQuery]);

  const filteredEntries = useMemo(() => {
    const keyword = submittedQuery.trim().toLowerCase();
    if (!keyword) {
      return combinedEntries;
    }
    return combinedEntries.filter((entry) =>
      entry.title.toLowerCase().includes(keyword),
    );
  }, [combinedEntries, submittedQuery]);
  const pageCount = Math.max(
    1,
    Math.ceil(filteredEntries.length / pageSize),
  );
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const entries = filteredEntries.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    const param = searchParams.get("page");
    const nextPage = param ? Number(param) : 1;
    if (!Number.isNaN(nextPage)) {
      setPage(Math.min(Math.max(nextPage, 1), pageCount));
    }
  }, [searchParams, pageCount]);

  const updatePage = (nextPage: number, nextQuery = submittedQuery) => {
    const bounded = Math.min(Math.max(nextPage, 1), pageCount);
    setPage(bounded);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(bounded));
    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }
    isSyncingRef.current = true;
    router.replace(`/journal?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    const param = searchParams.get("q") ?? "";
    if (param && param !== submittedQuery) {
      setQuery(param);
      setSubmittedQuery(param);
      return;
    }
    if (!param && submittedQuery) {
      setQuery("");
      setSubmittedQuery("");
    }
  }, [searchParams, submittedQuery]);

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
            <form
              className="flex w-full flex-col gap-2 sm:w-auto"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedQuery(query);
                updatePage(1, query);
              }}
            >
              <div className="flex w-full gap-3 sm:w-auto">
                <div className="relative w-full sm:w-96">
                  <input
                    type="text"
                    placeholder="제목을 입력하세요."
                    value={query}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setQuery(nextValue);
                      if (!nextValue.trim()) {
                        setSubmittedQuery("");
                        updatePage(1, "");
                      }
                      setIsSuggestionOpen(Boolean(nextValue.trim()));
                    }}
                    onKeyDown={(event) => {
                      if (suggestedEntries.length === 0) {
                        return;
                      }
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setActiveSuggestionIndex((prev) =>
                          prev < suggestedEntries.length - 1 ? prev + 1 : 0,
                        );
                        return;
                      }
                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        setActiveSuggestionIndex((prev) =>
                          prev > 0 ? prev - 1 : suggestedEntries.length - 1,
                        );
                        return;
                      }
                      if (event.key === "Enter") {
                        if (activeSuggestionIndex >= 0) {
                          event.preventDefault();
                          const selected =
                            suggestedEntries[activeSuggestionIndex];
                          if (selected) {
                            setQuery(selected.title);
                            setSubmittedQuery(selected.title);
                            updatePage(1, selected.title);
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
                      {suggestedEntries.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400">
                          추천 검색어가 없습니다.
                        </div>
                      ) : (
                        <ul className="max-h-56 overflow-auto py-1 text-sm text-slate-700">
                          {suggestedEntries.map((entry, index) => (
                            <li key={`suggest-${entry.id}`}>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuery(entry.title);
                                  setSubmittedQuery(entry.title);
                                  updatePage(1, entry.title);
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
                                  {entry.title}
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
              {isLoading ? "불러오는 중" : `총 ${filteredEntries.length}건`}
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
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="grid grid-cols-[80px_minmax(0,1fr)_140px_140px] items-center border-b border-slate-100 px-4 py-3 text-sm text-slate-700 last:border-b-0"
            >
              <span className="text-slate-500">
                {startIndex + index + 1}
              </span>
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
