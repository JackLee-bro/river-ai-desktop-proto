import Link from "next/link";

import MapView, { type MapPoint } from "../../_components/MapView";
import { journalEntries } from "../../_data/journals";
import { stations } from "../../_data/stations";

type PageProps = {
  params: { id: string };
};

export default function JournalDetailPage({ params }: PageProps) {
  const entry =
    journalEntries.find((item) => item.id === params.id) ??
    journalEntries[0];

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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Journal
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            일지 상세
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{entry.date}</span>
            <span>작성자: {entry.author}</span>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.5fr_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              제목:{" "}
              <span className="font-semibold text-slate-900">
                {entry.title}
              </span>
            </div>
            <div className="mt-4 space-y-2 rounded-xl border border-slate-100 px-4 py-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{entry.summary}</p>
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
                  <div className="flex h-24 items-center justify-center text-xs font-semibold text-slate-400">
                    {photo.label}
                  </div>
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
                href="/journal/new"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                수정
              </Link>
              <button
                type="button"
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-sm"
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
    </main>
  );
}

export async function generateStaticParams() {
  return journalEntries.map((entry) => ({ id: entry.id }));
}
