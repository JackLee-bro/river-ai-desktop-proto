"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import MapView, { type MapPoint } from "../../_components/MapView";
import { stations, type Station } from "../../_data/stations";
import {
  mergeStations,
  readStoredStations,
} from "../../_data/stationsStorage";
import StationImageGallery from "./StationImageGallery";

const createFallbackStation = (id: string): Station => ({
  id,
  name: "임시 관측소",
  address: "더미 데이터입니다.",
  river: "미정",
  manager: "미정",
  phone: "000-0000-0000",
  updatedAt: "2025-03-20 00:00",
  coords: [35.1796, 129.0756],
  images: [
    { id: "overview", label: "관측소 전경" },
    { id: "equipment", label: "장비 상태" },
    { id: "sensor", label: "센서 부착부" },
  ],
});

export default function StationDetailPage() {
  const params = useParams();
  const stationId = Array.isArray(params?.id)
    ? params?.id[0]
    : params?.id;
  const [mergedStations, setMergedStations] =
    useState<Station[]>(stations);

  useEffect(() => {
    const stored = readStoredStations();
    setMergedStations(mergeStations(stations, stored));
  }, []);

  const station = useMemo(() => {
    const id = stationId ?? "temp-station";
    const found = mergedStations.find((item) => item.id === id);
    if (found) {
      return found;
    }
    if (stations.length > 0) {
      return {
        ...stations[0],
        id,
        name: "임시 관측소",
        address: "더미 데이터입니다.",
        updatedAt: "2025-03-20 00:00",
      };
    }
    return createFallbackStation(id);
  }, [mergedStations, stationId]);

  const points: MapPoint[] = [
    {
      id: station.id,
      label: station.name,
      position: station.coords,
      kind: "station",
    },
  ];
  const infoItems: Array<{ label: string; value: string }> = [
    { label: "코드번호", value: station.codeNumber ?? "2022685" },
    { label: "관측소명", value: station.name },
    {
      label: "관측소명(영문)",
      value:
        station.nameEn ??
        (station.id ?? "TEMP")
          .toString()
          .replace(/-/g, " ")
          .toUpperCase(),
    },
    { label: "주소", value: station.address },
    { label: "수계명", value: station.basinName ?? "낙동강권" },
    { label: "하천명", value: station.river },
    {
      label: "하구합류점부터 거리(km)",
      value: station.distanceFromMouthKm ?? "12.4",
    },
    { label: "관측개시일", value: station.startDate ?? "2018-05-12" },
    { label: "관측방법", value: station.observationMethod ?? "레이더" },
    { label: "전송방법", value: station.transferMethod ?? "LTE" },
    { label: "위도(WGS84)", value: station.coords[0].toFixed(6) },
    { label: "경도(WGS84)", value: station.coords[1].toFixed(6) },
    {
      label: "수위표 영점표고(m)",
      value: station.zeroElevation ?? "4.25",
    },
    {
      label: "수준거 표고(m)",
      value: station.benchmarkElevation ?? "6.10",
    },
    {
      label: "수위표 최고득수(m)",
      value: station.maxStage ?? "7.80",
    },
    { label: "유역면적(km²)", value: station.basinArea ?? "43.7" },
    { label: "조석영향", value: station.tideInfluence ?? "없음" },
    { label: "유량측정", value: station.flowMeasurement ?? "월 1회" },
    { label: "비고", value: station.note ?? "운영중" },
  ];
  const infoPairs = Array.from(
    { length: Math.ceil(infoItems.length / 2) },
    (_, index) => infoItems.slice(index * 2, index * 2 + 2),
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-semibold text-slate-900">
              {station.name}
            </h1>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_minmax(0,1fr)] lg:items-stretch">
          <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              관측소 정보
            </h2>
            <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm text-slate-700">
                <tbody>
                  {infoPairs.map((pair, index) => (
                    <tr
                      key={pair[0].label}
                      className={index < infoPairs.length - 1 ? "border-b border-slate-100" : ""}
                    >
                      <th className="w-1/4 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-500">
                        {pair[0].label}
                      </th>
                      <td className="w-1/4 px-4 py-3 font-semibold text-slate-900">
                        {pair[0].value}
                      </td>
                      <th className="w-1/4 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-500">
                        {pair[1]?.label ?? ""}
                      </th>
                      <td className="w-1/4 px-4 py-3 font-semibold text-slate-900">
                        {pair[1]?.value ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="min-h-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:min-h-[320px] lg:h-full">
            <MapView points={points} height="100%" />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              관측소 사진
            </h2>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              이미지 {station.images.length}
            </p>
          </div>
          <StationImageGallery images={station.images} />
        </section>
      </div>
    </main>
  );
}
