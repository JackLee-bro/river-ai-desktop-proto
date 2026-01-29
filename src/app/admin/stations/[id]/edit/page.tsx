"use client";

import Link from "next/link";

export default function AdminStationEditPage() {
  return (
    <main className="flex flex-col gap-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          관측소 수정
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          관측소 수정 기능은 준비 중입니다.
        </p>
      </header>
      <Link
        href="/admin/stations"
        className="w-fit rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
      >
        관측소 목록으로
      </Link>
    </main>
  );
}
