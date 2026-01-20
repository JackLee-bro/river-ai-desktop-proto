const dummyPhotos = [
  { id: "photo-1", label: "현장 사진 1" },
  { id: "photo-2", label: "현장 사진 2" },
  { id: "photo-3", label: "현장 사진 3" },
];

const selectedLocations = [
  "해운대 관측소",
  "수영 관측소",
  "강서 관측소",
];

export default function JournalFormPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Journal
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              일지 작성 / 수정
            </h1>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  날짜
                </p>
                <input
                  type="text"
                  placeholder="2025-12-30"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  제목
                </p>
                <input
                  type="text"
                  placeholder="일지 제목을 입력하세요"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  내용
                </p>
                <textarea
                  placeholder="점검 내용 및 특이사항을 기록하세요."
                  className="mt-2 min-h-[180px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  사진첨부
                </p>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  파일 추가
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {dummyPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div className="flex h-24 items-center justify-center text-xs font-semibold text-slate-400">
                      {photo.label}
                    </div>
                    <button
                      type="button"
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-slate-500 shadow"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                저장
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
              >
                취소
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
                {selectedLocations.map((item) => (
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
            </div>

            <div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgba(226,232,240,0.65), rgba(248,250,252,0.9))",
                }}
              />
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.35) 1px, transparent 0)",
                  backgroundSize: "22px 22px",
                }}
              />
              <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-sm backdrop-blur">
                Map
              </div>
              <div className="absolute right-6 top-1/3 flex flex-col items-center gap-2">
                {["A", "B", "C"].map((label) => (
                  <div
                    key={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-xs font-semibold text-white shadow"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
