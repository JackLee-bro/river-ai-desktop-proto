import Link from "next/link";

import { fetchStationDetail } from "../../../lib/api";

type StationDetailPageProps = {
  params: {
    codeNumber: string;
  };
};

export default async function StationDetailPage({
  params,
}: StationDetailPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const codeNumber = resolvedParams?.codeNumber ?? "";
  const normalizedCodeNumber = String(codeNumber).trim();
  const isInvalidCodeNumber =
    !normalizedCodeNumber ||
    normalizedCodeNumber === "undefined" ||
    normalizedCodeNumber === "null" ||
    normalizedCodeNumber === "NaN";
  let station: Awaited<ReturnType<typeof fetchStationDetail>> | null = null;
  let loadError = "";
  if (isInvalidCodeNumber) {
    loadError = "유효하지 않은 코드번호입니다.";
  } else {
    try {
      station = await fetchStationDetail(normalizedCodeNumber);
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Failed to load";
    }
  }

  if (!station) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <header className="rounded-2xl bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">
              관측소 정보를 불러올 수 없습니다.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              코드번호: {codeNumber}
            </p>
            {loadError ? (
              <p className="mt-2 text-xs text-rose-500">{loadError}</p>
            ) : null}
          </header>
          <Link
            href="/"
            className="w-fit rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            목록으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            {station.stationName ?? station.name ?? "관측소 상세"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            코드번호: {station.codeNumber ?? codeNumber}
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-slate-400">관측소명</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.stationName ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">관측소명(영문)</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.stationNameEn ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">하천명</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.riverName ?? station.river ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">수계명</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.basinName ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">유역면적</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.basinArea ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">주소</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.address ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">위도</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.latitude ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">경도</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.longitude ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">위도(DMS)</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.latitudeDms ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">경도(DMS)</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.longitudeDms ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">카테고리</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.category ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">관측방법</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.observationMethod ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">관측개시일</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.observationStartDate ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">전송방법</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.transmissionMethod ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">최고수위</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.maxGaugeLevel ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">유량측정</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.flowMeasurementYn ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">조석영향</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.tidalInfluenceYn ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">하구/합류점 거리</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.distFromMouthOrConfluence ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">비고</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {station.locationNote ?? "-"}
              </dd>
            </div>
          </dl>
        </section>

        <Link
          href="/stations"
          className="w-fit rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
        >
          목록으로
        </Link>
      </div>
    </main>
  );
}
