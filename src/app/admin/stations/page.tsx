export default function AdminStationsPage() {
  return (
    <main className="flex flex-col gap-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          관측소 관리
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          관측소 정보 및 대표 이미지 설정을 관리하세요.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            placeholder="관측소 검색"
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 sm:w-72"
          />
          <button
            type="button"
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            관측소 등록
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={`station-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="h-28 rounded-xl bg-slate-200" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                관측소 이름
              </h3>
              <p className="mt-1 text-xs text-slate-500">부산광역시</p>
              <div className="mt-3 flex gap-2 text-xs">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
                >
                  편집
                </button>
                <button
                  type="button"
                  className="rounded-full bg-rose-500 px-3 py-1 text-white"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
