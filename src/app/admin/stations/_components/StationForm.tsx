"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { Station } from "../../../_data/stations";
import { saveStoredStation } from "../../../_data/stationsStorage";

type StationFormProps = {
  mode: "new" | "edit";
  initialStation?: Station | null;
  returnTo?: string;
};

const DEFAULT_COORDS: [number, number] = [35.1796, 129.0756];
const DEFAULT_CODE_NUMBER = "2022685";
const DEFAULT_BASIN_NAME = "낙동강권";
const DEFAULT_DISTANCE_KM = "12.4";
const DEFAULT_START_DATE = "2018-05-12";
const DEFAULT_OBSERVATION_METHOD = "레이더";
const DEFAULT_TRANSFER_METHOD = "LTE";
const DEFAULT_ZERO_ELEVATION = "4.25";
const DEFAULT_BENCHMARK_ELEVATION = "6.10";
const DEFAULT_MAX_STAGE = "7.80";
const DEFAULT_BASIN_AREA = "43.7";
const DEFAULT_TIDE_INFLUENCE = "없음";
const DEFAULT_FLOW_MEASUREMENT = "월 1회";
const DEFAULT_NOTE = "운영중";

type FacilityImageItem = {
  id: string;
  url: string;
  file?: File;
  kind: "existing" | "new";
};

const formatTimestamp = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export default function StationForm({
  mode,
  initialStation,
  returnTo,
}: StationFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [codeNumber, setCodeNumber] = useState("");
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [address, setAddress] = useState("");
  const [basinName, setBasinName] = useState("");
  const [river, setRiver] = useState("");
  const [distanceFromMouthKm, setDistanceFromMouthKm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [observationMethod, setObservationMethod] = useState("");
  const [transferMethod, setTransferMethod] = useState("");
  const [latitude, setLatitude] = useState(
    DEFAULT_COORDS[0].toString(),
  );
  const [longitude, setLongitude] = useState(
    DEFAULT_COORDS[1].toString(),
  );
  const [zeroElevation, setZeroElevation] = useState("");
  const [benchmarkElevation, setBenchmarkElevation] = useState("");
  const [maxStage, setMaxStage] = useState("");
  const [basinArea, setBasinArea] = useState("");
  const [tideInfluence, setTideInfluence] = useState("");
  const [flowMeasurement, setFlowMeasurement] = useState("");
  const [note, setNote] = useState("");
  const [facilityImages, setFacilityImages] = useState<
    FacilityImageItem[]
  >([]);
  const [formError, setFormError] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!initialStation) {
      return;
    }
    setCodeNumber(initialStation.codeNumber ?? DEFAULT_CODE_NUMBER);
    setName(initialStation.name ?? "");
    setNameEn(
      initialStation.nameEn ??
        (initialStation.id ?? "TEMP")
          .toString()
          .replace(/-/g, " ")
          .toUpperCase(),
    );
    setAddress(initialStation.address ?? "");
    setBasinName(initialStation.basinName ?? DEFAULT_BASIN_NAME);
    setRiver(initialStation.river ?? "");
    setDistanceFromMouthKm(
      initialStation.distanceFromMouthKm ?? DEFAULT_DISTANCE_KM,
    );
    setStartDate(initialStation.startDate ?? DEFAULT_START_DATE);
    setObservationMethod(
      initialStation.observationMethod ?? DEFAULT_OBSERVATION_METHOD,
    );
    setTransferMethod(
      initialStation.transferMethod ?? DEFAULT_TRANSFER_METHOD,
    );
    setLatitude(initialStation.coords[0]?.toString() ?? "");
    setLongitude(initialStation.coords[1]?.toString() ?? "");
    setZeroElevation(
      initialStation.zeroElevation ?? DEFAULT_ZERO_ELEVATION,
    );
    setBenchmarkElevation(
      initialStation.benchmarkElevation ?? DEFAULT_BENCHMARK_ELEVATION,
    );
    setMaxStage(initialStation.maxStage ?? DEFAULT_MAX_STAGE);
    setBasinArea(initialStation.basinArea ?? DEFAULT_BASIN_AREA);
    setTideInfluence(
      initialStation.tideInfluence ?? DEFAULT_TIDE_INFLUENCE,
    );
    setFlowMeasurement(
      initialStation.flowMeasurement ?? DEFAULT_FLOW_MEASUREMENT,
    );
    setNote(initialStation.note ?? DEFAULT_NOTE);
    const images = (initialStation.images ?? [])
      .filter((image) => Boolean(image.url))
      .map((image) => ({
        id: image.id,
        url: image.url ?? "",
        kind: "existing" as const,
      }));
    setFacilityImages(images);
  }, [initialStation]);

  const handleAddFile = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }
    const nextItems = selectedFiles.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      file,
      kind: "new" as const,
    }));
    setFacilityImages((prev) => [...prev, ...nextItems]);
    event.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setFacilityImages((prev) => {
      const target = prev[index];
      if (target?.kind === "new") {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  useEffect(() => {
    return () => {
      facilityImages.forEach((image) => {
        if (image.kind === "new") {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [facilityImages]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("file-read-failed"));
      reader.readAsDataURL(file);
    });

  const buildFacilityImages = async (): Promise<Station["images"]> => {
    const entries = await Promise.all(
      facilityImages.map(async (item, index) => {
        let url = item.url;
        if (item.kind === "new" && item.file) {
          url = await readFileAsDataUrl(item.file);
        }
        return {
          id: item.id,
          label:
            index === 0
              ? "대표 이미지"
              : `관측소 시설 ${index}`,
          url,
        };
      }),
    );
    return entries;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const id = initialStation?.id ?? `station-${Date.now()}`;
    const parsedLat = Number.parseFloat(latitude);
    const parsedLng = Number.parseFloat(longitude);
    if (
      Number.isNaN(parsedLat) ||
      Number.isNaN(parsedLng) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      setFormError("위도/경도 값을 올바르게 입력해주세요.");
      return;
    }
    const coords: [number, number] = [parsedLat, parsedLng];
    const images = await buildFacilityImages();
    const nextStation: Station = {
      id,
      codeNumber,
      name,
      nameEn,
      address,
      basinName,
      river,
      manager: initialStation?.manager ?? "",
      phone: initialStation?.phone ?? "",
      distanceFromMouthKm,
      startDate,
      observationMethod,
      transferMethod,
      updatedAt: formatTimestamp(),
      coords,
      zeroElevation,
      benchmarkElevation,
      maxStage,
      basinArea,
      tideInfluence,
      flowMeasurement,
      note,
      images,
    };
    saveStoredStation(nextStation);
    router.push(`/admin/stations?highlight=${id}`);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {formError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </div>
      ) : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          기본 정보
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            코드번호 (필수)
            <input
              required
              type="text"
              value={codeNumber}
              onChange={(event) => setCodeNumber(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            관측소명 (필수)
            <input
              required
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            관측소명(영문)
            <input
              type="text"
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            주소
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            수계명
            <input
              type="text"
              value={basinName}
              onChange={(event) => setBasinName(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            하천명
            <input
              type="text"
              value={river}
              onChange={(event) => setRiver(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            하구합류점부터 거리(km)
            <input
              type="text"
              value={distanceFromMouthKm}
              onChange={(event) =>
                setDistanceFromMouthKm(event.target.value)
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            관측개시일
            <input
              type="text"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            관측방법
            <input
              type="text"
              value={observationMethod}
              onChange={(event) =>
                setObservationMethod(event.target.value)
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            전송방법
            <input
              type="text"
              value={transferMethod}
              onChange={(event) =>
                setTransferMethod(event.target.value)
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            위도(WGS84) (필수)
            <input
              required
              type="text"
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            경도(WGS84) (필수)
            <input
              required
              type="text"
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            수위표 영점표고(m)
            <input
              type="text"
              value={zeroElevation}
              onChange={(event) =>
                setZeroElevation(event.target.value)
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            수준거 표고(m)
            <input
              type="text"
              value={benchmarkElevation}
              onChange={(event) =>
                setBenchmarkElevation(event.target.value)
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            수위표 최고득수(m)
            <input
              type="text"
              value={maxStage}
              onChange={(event) => setMaxStage(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            유역면적(km²)
            <input
              type="text"
              value={basinArea}
              onChange={(event) => setBasinArea(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            조석영향
            <input
              type="text"
              value={tideInfluence}
              onChange={(event) =>
                setTideInfluence(event.target.value)
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            유량측정
            <input
              type="text"
              value={flowMeasurement}
              onChange={(event) =>
                setFlowMeasurement(event.target.value)
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 sm:col-span-2">
            비고
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-[96px] resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            관측소 시설 사진
          </h2>
          <button
            type="button"
            onClick={handleAddFile}
            className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            사진 추가
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {facilityImages.map((item, index) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex === null || dragIndex === index) {
                  return;
                }
                setFacilityImages((prev) => {
                  const next = [...prev];
                  const [moved] = next.splice(dragIndex, 1);
                  next.splice(index, 0, moved);
                  return next;
                });
                setDragIndex(null);
              }}
            >
              <img
                src={item.url}
                alt={item.id}
                className="h-24 w-full object-cover"
              />
              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                {index === 0 ? "대표 이미지" : "시설 이미지"}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-slate-500 shadow"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            if (returnTo) {
              router.push(returnTo);
              return;
            }
            router.back();
          }}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
        >
          취소
        </button>
        <button
          type="submit"
          className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          {mode === "new" ? "등록하기" : "저장하기"}
        </button>
      </div>
    </form>
  );
}
