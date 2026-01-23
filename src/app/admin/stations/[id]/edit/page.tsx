"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { stations, type Station } from "../../../../_data/stations";
import {
  mergeStations,
  readStoredStations,
} from "../../../../_data/stationsStorage";
import StationForm from "../../_components/StationForm";

export default function AdminStationEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const stationId = Array.isArray(params?.id)
    ? params?.id[0]
    : params?.id;
  const [mergedStations, setMergedStations] =
    useState<Station[]>(stations);
  const fromPage = searchParams.get("fromPage");
  const returnTo = fromPage
    ? `/admin/stations?page=${fromPage}`
    : "/admin/stations";

  useEffect(() => {
    const loadStations = async () => {
      // TODO: replace with API call when available.
      const stored = readStoredStations();
      setMergedStations(mergeStations(stations, stored));
    };
    void loadStations();
  }, []);

  const station = useMemo(() => {
    if (!stationId) {
      return null;
    }
    return mergedStations.find((item) => item.id === stationId) ?? null;
  }, [mergedStations, stationId]);

  if (!station) {
    return (
      <main className="flex flex-col gap-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            관측소 수정
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            관측소 정보를 찾을 수 없습니다.
          </p>
        </header>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          목록으로 돌아가서 다시 선택해주세요.
        </div>
        <Link
          href="/admin/stations"
          className="w-fit rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
        >
          관측소 목록으로
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          관측소 수정
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          관측소 정보를 수정하세요.
        </p>
      </header>

      <StationForm
        mode="edit"
        initialStation={station}
        returnTo={returnTo}
      />
    </main>
  );
}
