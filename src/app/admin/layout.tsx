import Link from "next/link";

import AdminGate from "./AdminGate";

const adminLinks = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/journals", label: "일지 관리" },
  { href: "/admin/stations", label: "관측소 관리" },
  { href: "/admin/users", label: "사용자 관리" },
  { href: "/admin/settings", label: "설정" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-10">
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:hidden">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex w-full gap-6">
          <aside className="hidden w-60 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Admin
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                관리자 메뉴
              </h2>
            </div>
            <nav className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>

            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </div>
    </AdminGate>
  );
}
