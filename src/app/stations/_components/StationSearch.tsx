"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type StationSearchProps = {
  actionPath?: string;
  initialKeyword?: string;
  size: number;
  actions?: React.ReactNode;
};

type SuggestionsResponse = {
  suggestions: string[];
};

const normalizeKeyword = (value: string) => value.trim();

export default function StationSearch({
  actionPath = "/stations",
  initialKeyword = "",
  size,
  actions,
}: StationSearchProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const hasKeyword = normalizeKeyword(keyword).length > 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const trimmed = normalizeKeyword(keyword);
    if (!trimmed) {
      setSuggestions([]);
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          keyword: trimmed,
          limit: "5",
        });
        const response = await fetch(
          `/api/stations/suggestions?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          setSuggestions([]);
          setActiveIndex(-1);
          return;
        }
        const data = (await response.json()) as SuggestionsResponse;
        const nextSuggestions = Array.isArray(data.suggestions)
          ? data.suggestions
          : [];
        setSuggestions(nextSuggestions);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setSuggestions([]);
          setActiveIndex(-1);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [keyword, isOpen]);

  const handleSelect = (value: string) => {
    setKeyword(value);
    setSuggestions([]);
    setActiveIndex(-1);
    setIsOpen(false);
    const params = new URLSearchParams({
      keyword: value,
      page: "1",
      size: String(size),
    });
    router.push(`${actionPath}?${params.toString()}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => {
        if (index < 0) return 0;
        return Math.min(index + 1, suggestions.length - 1);
      });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        event.preventDefault();
        handleSelect(suggestions[activeIndex]);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
        setActiveIndex(-1);
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resultHint = useMemo(() => {
    if (!hasKeyword) return null;
    return (
      <p className="mt-2 text-xs text-slate-500">
        "{normalizeKeyword(keyword)}" 검색 결과
      </p>
    );
  }, [hasKeyword, keyword]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <form
        action={actionPath}
        method="get"
        className="flex w-full flex-col gap-2"
        onSubmit={() => {
          setSuggestions([]);
          setActiveIndex(-1);
          setIsOpen(false);
        }}
      >
        <div className="flex w-full flex-wrap gap-2 sm:flex-nowrap">
          <div ref={containerRef} className="relative flex-1">
            <input
              type="text"
              name="keyword"
              placeholder="관측소 검색"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              autoComplete="off"
            />
            {isLoading ? (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ...
              </span>
            ) : null}
            {isOpen && suggestions.length > 0 ? (
              <div className="absolute left-0 right-0 top-11 z-10 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-lg">
                {suggestions.map((item, index) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => handleSelect(item)}
                    className={
                      index === activeIndex
                        ? "block w-full bg-slate-100 px-3 py-2 text-left text-slate-900"
                        : "block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <input type="hidden" name="size" value={size} />
          <button
            type="submit"
            className="h-10 whitespace-nowrap rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            검색
          </button>
          {hasKeyword ? (
            <a
              href={actionPath}
              className="inline-flex h-10 items-center whitespace-nowrap rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              초기화
            </a>
          ) : null}
          {actions ? <div className="flex">{actions}</div> : null}
        </div>
        {resultHint}
      </form>
    </section>
  );
}
