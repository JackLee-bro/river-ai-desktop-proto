export default function AdminSettingsPage() {
  return (
    <main className="flex flex-col gap-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">설정</h1>
        <p className="mt-2 text-sm text-slate-500">
          권한 정책, 알림, 공통 설정을 관리하세요.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                공지사항 알림
              </p>
              <p className="text-xs text-slate-500">
                관리자 공지 등록 시 알림 전송
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600"
            >
              설정
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                데이터 보관 정책
              </p>
              <p className="text-xs text-slate-500">
                삭제/보관 기간 정책 설정
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600"
            >
              설정
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
