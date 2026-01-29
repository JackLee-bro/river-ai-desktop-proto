import Link from "next/link";

import { fetchStations, fetchStationsSearch } from "../../../lib/api";
import StationSearch from "../../stations/_components/StationSearch";

type AdminStationsPageProps = {
  searchParams?: {
    page?: string;
    size?: string;
    keyword?: string;
  };
};

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const normalizeCodeNumber = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value).trim();
  if (!text || text === "undefined" || text === "null" || text === "NaN") {
    return "";
  }
  return text;
};

export default async function AdminStationsPage({
  searchParams,
}: AdminStationsPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const requestedPage = parsePositiveInt(resolvedSearchParams?.page, 1);
  const size = parsePositiveInt(resolvedSearchParams?.size, 10);
  const keyword = resolvedSearchParams?.keyword?.trim() ?? "";
  const hasKeyword = keyword.length > 0;
  const data = hasKeyword
    ? await fetchStationsSearch(keyword, requestedPage, size)
    : await fetchStations(requestedPage, size);

  const pageCount = Math.max(1, Math.ceil(data.total / size));
  const currentPage = Math.min(Math.max(1, requestedPage), pageCount);
  const keywordParam = hasKeyword
    ? `&keyword=${encodeURIComponent(keyword)}`
    : "";

  return (
    <main className="flex flex-col gap-4">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          관측소 관리
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          관측소 검색/조회 화면입니다. (관리용)
        </p>
      </header>

      <StationSearch
        actionPath="/admin/stations"
        initialKeyword={keyword}
        size={size}
        actions={
          <Link
            href="/admin/stations/new"
            className="inline-flex h-10 items-center whitespace-nowrap rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            + 관측소 등록
          </Link>
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {data.stations.length === 0 ? (
          <p className="text-sm text-slate-500">
            {hasKeyword ? "검색 결과가 없습니다." : "관측소가 없습니다."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.stations.map((station, index) => {
              const codeNumber =
                station.codeNumber ??
                (station as { code_number?: string | number }).code_number ??
                (station as { code?: string | number }).code;
              const codeNumberValue = normalizeCodeNumber(codeNumber);
              const stationName =
                station.stationName ??
                station.name ??
                (station as { station_name?: string }).station_name ??
                "-";
              return (
                <li
                  key={String(
                    station.id ??
                      codeNumberValue ??
                      `${stationName}-${station.address ?? "station"}-${index}`,
                  )}
                  className="py-3"
                >
                  {codeNumberValue ? (
                    <Link
                      href={`/stations/${codeNumberValue}`}
                      className="text-sm font-semibold text-slate-900 hover:underline"
                    >
                      {stationName}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-slate-400">
                      {stationName} (코드 없음)
                    </span>
                  )}
                  {station.address ? (
                    <div className="text-xs text-slate-500">
                      {station.address}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        {(() => {
          const groupSize = 10;
          const groupStart =
            Math.floor((currentPage - 1) / groupSize) * groupSize + 1;
          const groupEnd = Math.min(groupStart + groupSize - 1, pageCount);
          const pages = Array.from(
            { length: groupEnd - groupStart + 1 },
            (_, index) => groupStart + index,
          );

          const isFirstPage = currentPage <= 1;
          const isLastPage = currentPage >= pageCount;

          return (
            <>
              {isFirstPage ? (
                <span className="cursor-not-allowed rounded-full border border-slate-200 px-3 py-1 text-slate-300">
                  «
                </span>
              ) : (
                <Link
                  href={`/admin/stations?page=1&size=${size}${keywordParam}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
                >
                  «
                </Link>
              )}
              {isFirstPage ? (
                <span className="cursor-not-allowed rounded-full border border-slate-200 px-3 py-1 text-slate-300">
                  ‹
                </span>
              ) : (
                <Link
                  href={`/admin/stations?page=${Math.max(1, currentPage - 1)}&size=${size}${keywordParam}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
                >
                  ‹
                </Link>
              )}
              {pages.map((page) => (
                <Link
                  key={page}
                  href={`/admin/stations?page=${page}&size=${size}${keywordParam}`}
                  className={
                    page === currentPage
                      ? "rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-slate-900"
                      : "rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-slate-300"
                  }
                >
                  {page}
                </Link>
              ))}
              {isLastPage ? (
                <span className="cursor-not-allowed rounded-full border border-slate-200 px-3 py-1 text-slate-300">
                  ›
                </span>
              ) : (
                <Link
                  href={`/admin/stations?page=${Math.min(pageCount, currentPage + 1)}&size=${size}${keywordParam}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
                >
                  ›
                </Link>
              )}
              {isLastPage ? (
                <span className="cursor-not-allowed rounded-full border border-slate-200 px-3 py-1 text-slate-300">
                  »
                </span>
              ) : (
                <Link
                  href={`/admin/stations?page=${pageCount}&size=${size}${keywordParam}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
                >
                  »
                </Link>
              )}
            </>
          );
        })()}
      </nav>
    </main>
  );
}
