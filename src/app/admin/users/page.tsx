export default function AdminUsersPage() {
  return (
    <main className="flex flex-col gap-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          사용자 관리
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          사용자 권한 및 계정 상태를 관리하세요.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            placeholder="이메일/이름 검색"
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 sm:w-72"
          />
          <button
            type="button"
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            사용자 초대
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[160px_minmax(0,1fr)_120px_120px] border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span>이메일</span>
            <span>이름</span>
            <span>권한</span>
            <span>상태</span>
          </div>
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={`user-${index}`}
              className="grid grid-cols-[160px_minmax(0,1fr)_120px_120px] items-center border-b border-slate-100 px-4 py-3 text-sm text-slate-700 last:border-b-0"
            >
              <span className="font-medium text-slate-900">
                admin{index}@sample.com
              </span>
              <span className="text-slate-500">관리자</span>
              <span className="text-slate-500">관리자</span>
              <span className="text-emerald-600">활성</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
