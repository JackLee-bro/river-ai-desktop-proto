export default function AdminJournalsPage() {
  return (
    <main className="flex flex-col gap-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          일지 관리
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          일지 목록, 검색, 수정/삭제 기능을 여기에 구성하세요.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            placeholder="제목/작성자 검색"
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 sm:w-72"
          />
          <button
            type="button"
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            신규 일지 등록
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[100px_minmax(0,1fr)_140px_140px_120px] border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span>No</span>
            <span>제목</span>
            <span>작성자</span>
            <span>일자</span>
            <span>작업</span>
          </div>
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={`row-${index}`}
              className="grid grid-cols-[100px_minmax(0,1fr)_140px_140px_120px] items-center border-b border-slate-100 px-4 py-3 text-sm text-slate-700 last:border-b-0"
            >
              <span className="text-slate-500">{index + 1}</span>
              <span className="font-medium text-slate-900">
                일지 제목 예시
              </span>
              <span className="text-slate-500">관리자</span>
              <span className="text-slate-500">2025-03-20</span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
                >
                  수정
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
