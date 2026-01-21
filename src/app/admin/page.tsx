import Link from "next/link";

const quickLinks = [
  {
    title: "일지 관리",
    description: "일지 목록/검색/삭제/수정",
    href: "/admin/journals",
  },
  {
    title: "관측소 관리",
    description: "관측소 정보 및 사진 관리",
    href: "/admin/stations",
  },
  {
    title: "사용자 관리",
    description: "권한/계정 상태 관리",
    href: "/admin/users",
  },
];

export default function AdminDashboardPage() {
  return (
    <main className="flex flex-col gap-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          대시보드
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          운영 현황을 빠르게 확인할 수 있는 관리자 홈입니다.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {link.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{link.description}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          오늘의 요약
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "신규 일지", value: "12" },
            { label: "점검 필요 관측소", value: "3" },
            { label: "활성 사용자", value: "27" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
