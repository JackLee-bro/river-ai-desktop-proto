"use client";

import StationForm from "../_components/StationForm";

export default function AdminStationNewPage() {
  return (
    <main className="flex flex-col gap-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          관측소 등록
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          신규 관측소 정보를 입력하고 등록하세요.
        </p>
      </header>

      <StationForm mode="new" />
    </main>
  );
}
