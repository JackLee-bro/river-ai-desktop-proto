"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import MapView, { type MapPoint } from "../../_components/MapView";
import { journalEntries, type JournalEntry } from "../../_data/journals";

const STORAGE_KEY = "journalEntries";
const defaultLocations: string[] = [];

type ApiStation = {
  id?: string;
  name?: string;
  stationName?: string;
  codeName?: string | number;
  codeNumber?: string | number;
  code_number?: string | number;
  code?: string | number;
  codeNum?: string | number;
  stationCode?: string | number;
  coords?: [number, number];
  latitude?: string | number;
  longitude?: string | number;
  lat?: string | number;
  lng?: string | number;
};

type StationLookup = {
  id: string;
  name: string;
  coords?: [number, number];
  codeNumber?: string | number;
};

type StationStatus = "idle" | "loading" | "ok" | "no-match";

const normalizeName = (value: string) => value.trim().toLowerCase();

const getStationLabel = (station: ApiStation) =>
  station.stationName ?? station.name ?? "";

const parseNumber = (value: string | number | undefined) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const sanitized = value.replace(/,/g, "").trim();
    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getCodeNumber = (station: ApiStation) =>
  station.codeName ??
  station.codeNumber ??
  station.code_number ??
  station.code ??
  station.codeNum ??
  station.stationCode;

const extractCoords = (station: ApiStation): [number, number] | undefined => {
  if (
    Array.isArray(station.coords) &&
    station.coords.length >= 2 &&
    Number.isFinite(station.coords[0]) &&
    Number.isFinite(station.coords[1])
  ) {
    const first = station.coords[0];
    const second = station.coords[1];
    if (Math.abs(first) > 90 && Math.abs(second) <= 90) {
      return [second, first];
    }
    return [first, second];
  }
  const latRaw = parseNumber(station.latitude ?? station.lat);
  const lngRaw = parseNumber(station.longitude ?? station.lng);
  if (latRaw === null || lngRaw === null) {
    return undefined;
  }
  // Some upstream data appears to be [longitude, latitude]. If latitude is out
  // of range and longitude is in range, swap them.
  if (Math.abs(latRaw) > 90 && Math.abs(lngRaw) <= 90) {
    return [lngRaw, latRaw];
  }
  return [latRaw, lngRaw];
};

const fetchStationsByName = async (keyword: string) => {
  const params = new URLSearchParams({
    stationName: keyword,
  });
  const response = await fetch(`/api/stations/by-name?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as { rows?: ApiStation[] };
  return Array.isArray(data.rows) ? data.rows : [];
};

export default function JournalFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<
    { file: File; url: string }[]
  >([]);
  const [existingPhotos, setExistingPhotos] = useState<
    JournalEntry["photos"]
  >([]);
  const [stationQuery, setStationQuery] = useState("");
  const [stationSuggestions, setStationSuggestions] = useState<StationLookup[]>(
    [],
  );
  const [isStationLoading, setIsStationLoading] = useState(false);
  const [isStationOpen, setIsStationOpen] = useState(false);
  const [activeStationIndex, setActiveStationIndex] = useState<number>(-1);
  const stationContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedStations, setSelectedStations] = useState<string[]>(
    defaultLocations,
  );
  const [stationDetailsByName, setStationDetailsByName] = useState<
    Record<string, StationLookup>
  >({});
  const [stationStatusByName, setStationStatusByName] = useState<
    Record<string, StationStatus>
  >({});
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showError, setShowError] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingStored, setIsEditingStored] = useState(false);

  const handleShowDatePicker = (
    event: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>
  ) => {
    if (event.type !== "click") {
      return;
    }
    event.currentTarget.showPicker?.();
  };

  const isValid = Boolean(date) && Boolean(title.trim()) && Boolean(content.trim());

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      setShowError(true);
      setShowSaved(false);
      return;
    }
    setShowError(false);
    setShowSaved(false);
    const photoEntries = await Promise.all(
      files.map(
        (file, index) =>
          new Promise<{ id: string; label: string; url: string }>(
            (resolve, reject) => {
              const reader = new FileReader();
              const timestamp = Date.now();
              reader.onload = () => {
                resolve({
                  id: `photo-${timestamp}-${index}`,
                  label: file.name,
                  url: String(reader.result ?? ""),
                });
              };
              reader.onerror = () => reject(new Error("file-read-failed"));
              reader.readAsDataURL(file);
            },
          ),
      ),
    );
    const bodyLines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const summary =
      bodyLines[0] ?? content.trim().slice(0, 40) ?? "입력된 내용 없음";
    const shouldUpdateStored = Boolean(editingId) && isEditingStored;
    const newEntryId =
      shouldUpdateStored && editingId
        ? editingId
        : typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now());
    const stationMeta = selectedStations
      .map((name) => stationDetailsByName[name])
      .filter(
        (detail): detail is StationLookup & { coords: [number, number] } =>
          Boolean(detail?.coords),
      )
      .map((detail) => ({
        id: detail.id,
        name: detail.name,
        coords: detail.coords,
        codeNumber: detail.codeNumber,
      }));

    const newEntry: JournalEntry = {
      id: newEntryId,
      title: title.trim(),
      author: "관리자",
      date,
      summary,
      body: bodyLines.length ? bodyLines : [content.trim()],
      stations: selectedStations,
      stationMeta: stationMeta.length > 0 ? stationMeta : undefined,
      photos: [...existingPhotos, ...photoEntries],
    };
    try {
      // TODO: replace with API call when available.
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as JournalEntry[]) : [];
      const nextEntries = shouldUpdateStored
        ? parsed.map((entry) => (entry.id === newEntryId ? newEntry : entry))
        : [newEntry, ...parsed];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
    } catch {
      // Ignore storage errors and proceed with navigation.
    }
    setShowSaved(true);
    router.push(`/journal/${newEntryId}`);
  };

  const handleAddFile = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }
    setFiles((prev) => [...prev, ...selectedFiles]);
    event.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleRemoveExistingPhoto = (index: number) => {
    setExistingPhotos((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const upsertStationDetails = useCallback((detail: StationLookup) => {
    setStationDetailsByName((prev) => {
      const current = prev[detail.name];
      if (
        current &&
        current.id === detail.id &&
        current.coords?.[0] === detail.coords?.[0] &&
        current.coords?.[1] === detail.coords?.[1]
      ) {
        return prev;
      }
      return { ...prev, [detail.name]: detail };
    });
  }, []);

  const fetchStationDetailByName = useCallback(async (
    name: string,
  ): Promise<StationLookup | null> => {
    const keyword = name.trim();
    if (!keyword) {
      return null;
    }
    try {
      const list = await fetchStationsByName(keyword);
      if (list.length === 0) {
        return null;
      }
      const normalized = normalizeName(keyword);
      const matched =
        list.find((station) => normalizeName(getStationLabel(station)) === normalized) ??
        list[0];
      const matchedName = getStationLabel(matched).trim();
      if (!matchedName) {
        return null;
      }
      const coords = extractCoords(matched);
      const matchedCodeNumber = getCodeNumber(matched);
      const id = matched.id ?? matchedCodeNumber ?? matchedName;
      return {
        id: String(id),
        name: matchedName,
        coords,
        codeNumber: matchedCodeNumber,
      };
    } catch {
      return null;
    }
  }, []);

  const ensureStationDetails = useCallback(
    async (name: string) => {
      setStationStatusByName((prev) => ({ ...prev, [name]: "loading" }));
      const detail = await fetchStationDetailByName(name);
      if (detail) {
        upsertStationDetails(detail);
        setStationStatusByName((prev) => ({ ...prev, [name]: "ok" }));
        return;
      }
      setStationStatusByName((prev) => ({ ...prev, [name]: "no-match" }));
    },
    [fetchStationDetailByName, upsertStationDetails],
  );

  const handleAddStation = () => {
    const keyword = stationQuery.trim();
    if (!keyword) {
      return;
    }
    if (selectedStations.length >= 6) {
      alert("관측소는 최대 6개까지 추가할 수 있습니다.");
      return;
    }
    if (activeStationIndex >= 0 && activeStationIndex < stationSuggestions.length) {
      const activeSuggestion = stationSuggestions[activeStationIndex];
      setStationQuery(activeSuggestion.name);
      void handleAddStationLookup(activeSuggestion);
      return;
    }
    const suggestedMatch = stationSuggestions.find(
      (station) => station.name === keyword,
    );
    if (suggestedMatch) {
      setStationQuery(suggestedMatch.name);
      void handleAddStationLookup(suggestedMatch);
      return;
    }
    if (stationSuggestions.length > 0) {
      const firstSuggestion = stationSuggestions[0];
      setStationQuery(firstSuggestion.name);
      void handleAddStationLookup(firstSuggestion);
      return;
    }
    void (async () => {
      const detail = await fetchStationDetailByName(keyword);
      if (!detail) {
        alert("관측소를 찾을 수 없습니다.");
        setStationStatusByName((prev) => ({ ...prev, [keyword]: "no-match" }));
        return;
      }
      void handleAddStationLookup(detail);
    })();
  };

  const handleAddStationLookup = async (detail: StationLookup) => {
    if (selectedStations.length >= 6) {
      alert("관측소는 최대 6개까지 추가할 수 있습니다.");
      return;
    }
    if (selectedStations.includes(detail.name)) {
      alert("이미 추가된 관측소입니다.");
      return;
    }
    setStationStatusByName((prev) => ({ ...prev, [detail.name]: "loading" }));
    setStationQuery(detail.name);
    try {
      if (
        detail.coords &&
        Number.isFinite(detail.coords[0]) &&
        Number.isFinite(detail.coords[1])
      ) {
        const detailForSelection: StationLookup = {
          id: String(detail.id ?? detail.codeNumber ?? detail.name),
          name: detail.name,
          coords: detail.coords,
          codeNumber: detail.codeNumber,
        };
        setSelectedStations((prev) => [...prev, detail.name]);
        upsertStationDetails(detailForSelection);
        setStationStatusByName((prev) => ({ ...prev, [detail.name]: "ok" }));
        return;
      }
      if (!detail.codeNumber) {
        setStationStatusByName((prev) => ({ ...prev, [detail.name]: "no-match" }));
        alert("관측소 코드를 찾을 수 없습니다.");
        return;
      }
      const coords = detail.coords;
      if (!coords) {
        setStationStatusByName((prev) => ({ ...prev, [detail.name]: "no-match" }));
        alert("관측소 좌표를 불러오지 못했습니다.");
        return;
      }
      const detailForSelection: StationLookup = {
        id: String(detail.id ?? detail.codeNumber),
        name: detail.name,
        coords,
        codeNumber: detail.codeNumber,
      };
      setSelectedStations((prev) => [...prev, detail.name]);
      upsertStationDetails(detailForSelection);
      setStationStatusByName((prev) => ({ ...prev, [detail.name]: "ok" }));
    } finally {
      setStationSuggestions([]);
      setActiveStationIndex(-1);
      setIsStationOpen(false);
    }
  };

  const handleRemoveStation = (name: string) => {
    setSelectedStations((prev) => prev.filter((item) => item !== name));
    setStationDetailsByName((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setStationStatusByName((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  useEffect(() => {
    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setFilePreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [files]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      setEditingId(null);
      setIsEditingStored(false);
      return;
    }
    let storedEntries: JournalEntry[] = [];
    try {
      // TODO: replace with API call when available.
      const stored = localStorage.getItem(STORAGE_KEY);
      storedEntries = stored ? (JSON.parse(stored) as JournalEntry[]) : [];
    } catch {
      storedEntries = [];
    }
    const storedEntry = storedEntries.find((entry) => entry.id === id);
    const dummyEntry = journalEntries.find((entry) => entry.id === id);
    const entry = storedEntry ?? dummyEntry;
    if (!entry) {
      return;
    }
    setEditingId(id);
    setIsEditingStored(Boolean(storedEntry));
    setDate(entry.date);
    setTitle(entry.title);
    setContent(entry.body.join("\n"));
    const stationsToEnsure = entry.stations ?? defaultLocations;
    setSelectedStations(stationsToEnsure);
    const metaByName = (entry.stationMeta ?? []).reduce<
      Record<string, StationLookup>
    >((acc, meta) => {
      acc[meta.name] = {
        id: String(meta.id ?? meta.codeNumber ?? meta.name),
        name: meta.name,
        coords: meta.coords,
        codeNumber: meta.codeNumber,
      };
      return acc;
    }, {});
    setStationDetailsByName(metaByName);
    setStationStatusByName(
      stationsToEnsure.reduce<Record<string, StationStatus>>((acc, name) => {
        acc[name] = metaByName[name]?.coords ? "ok" : "idle";
        return acc;
      }, {}),
    );
    stationsToEnsure.forEach((name) => {
      if (!metaByName[name]?.coords) {
        void ensureStationDetails(name);
      }
    });
    setExistingPhotos(entry.photos ?? []);
    setFiles([]);
    setShowSaved(false);
  }, [ensureStationDetails, searchParams]);

  useEffect(() => {
    if (!isStationOpen) {
      return;
    }

    const trimmed = stationQuery.trim();
    if (!trimmed) {
      setStationSuggestions([]);
      setIsStationLoading(false);
      setActiveStationIndex(-1);
      return;
    }

    setIsStationLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const list = await fetchStationsByName(trimmed);
        const nextSuggestions = list
          .map((station) => {
            const name = getStationLabel(station).trim();
            const codeNumber = getCodeNumber(station);
            const coords = extractCoords(station);
            if (!name || !codeNumber) {
              return null;
            }
            return {
              id: String(codeNumber),
              name,
              codeNumber,
              coords,
            } satisfies StationLookup;
          })
          .filter((value): value is StationLookup => value !== null);
        setStationSuggestions(nextSuggestions);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setStationSuggestions([]);
        }
      } finally {
        setIsStationLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [stationQuery, isStationOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!stationContainerRef.current) return;
      if (!stationContainerRef.current.contains(event.target as Node)) {
        setStationSuggestions([]);
        setActiveStationIndex(-1);
        setIsStationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const stationPoints: MapPoint[] = useMemo(
    () =>
      selectedStations
        .map((name) => {
          const detail = stationDetailsByName[name];
          if (detail?.coords) {
            return {
              id: detail.id,
              label: detail.name,
              position: detail.coords,
              kind: "station",
            } satisfies MapPoint;
          }
          return null;
        })
        .filter((value): value is MapPoint => value !== null),
    [selectedStations, stationDetailsByName],
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-slate-900">
              일지 작성 / 수정
            </h1>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="grid gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  날짜
                </p>
                <div className="date-placeholder relative mt-2">
                  <input
                    type="date"
                    required
                    onClick={handleShowDatePicker}
                    onFocus={handleShowDatePicker}
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value);
                      if (showError) {
                        setShowError(false);
                      }
                    }}
                    className="date-input w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  />
                  <span className="date-placeholder-text">
                    날짜를 입력하세요.(필수)
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  제목
                </p>
                <input
                  type="text"
                  placeholder="제목을 입력하세요.(필수)"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (showError) {
                      setShowError(false);
                    }
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  내용
                </p>
                <textarea
                  placeholder="내용을 입력하세요.(필수)"
                  value={content}
                  onChange={(event) => {
                    setContent(event.target.value);
                    if (showError) {
                      setShowError(false);
                    }
                  }}
                  className="mt-2 min-h-[180px] w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
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
                  onClick={handleAddFile}
                  className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  파일 추가
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
                {existingPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  >
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.label}
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center text-xs font-semibold text-slate-400">
                        {photo.label}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(index)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-slate-500 shadow"
                    >
                      x
                    </button>
                  </div>
                ))}
                {filePreviews.map((preview, index) => (
                  <div
                    key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <img
                      src={preview.url}
                      alt={preview.file.name}
                      className="h-24 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-slate-500 shadow"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {showError && !isValid ? (
              <p className="mt-6 text-sm font-semibold text-rose-600">
                날짜, 제목, 내용을 모두 입력해 주세요.
              </p>
            ) : null}
            {showSaved ? (
              <p className="mt-3 text-sm font-semibold text-emerald-600">
                저장되었습니다.
              </p>
            ) : null}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
              >
                취소
              </button>
            </div>
          </form>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">
                관측소 위치
              </p>
              <div ref={stationContainerRef} className="relative z-20 mt-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  <span className="text-slate-400">🔍</span>
                  <input
                    type="text"
                    placeholder="관측소 검색(최대 6개)"
                    value={stationQuery}
                    onChange={(event) => {
                      setStationQuery(event.target.value);
                      setIsStationOpen(true);
                      setActiveStationIndex(-1);
                    }}
                    onFocus={() => setIsStationOpen(true)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setIsStationOpen(true);
                        if (stationSuggestions.length === 0) return;
                        setActiveStationIndex((index) => {
                          if (index < 0) return 0;
                          return Math.min(index + 1, stationSuggestions.length - 1);
                        });
                        return;
                      }
                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        setIsStationOpen(true);
                        if (stationSuggestions.length === 0) return;
                        setActiveStationIndex((index) => Math.max(index - 1, 0));
                        return;
                      }
                      if (event.key === "Enter") {
                        event.preventDefault();
                      if (
                        activeStationIndex >= 0 &&
                        activeStationIndex < stationSuggestions.length
                      ) {
                          void handleAddStationLookup(
                            stationSuggestions[activeStationIndex],
                          );
                          return;
                        }
                        handleAddStation();
                      }
                    }}
                    className="w-full bg-transparent text-sm text-slate-700 outline-none"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={handleAddStation}
                    className="whitespace-nowrap rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    추가
                  </button>
                </div>
                {isStationOpen && stationSuggestions.length > 0 ? (
                  <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-lg">
                    {stationSuggestions.map((item, index) => (
                      <button
                        key={`${item.id}-${index}`}
                        type="button"
                        onClick={() => void handleAddStationLookup(item)}
                        className={
                          index === activeStationIndex
                            ? "block w-full bg-slate-100 px-3 py-2 text-left text-slate-900"
                            : "block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                        }
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                {selectedStations.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  >
                    <div className="flex items-center justify-between">
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStation(item)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        x
                      </button>
                    </div>
                    {stationStatusByName[item] === "loading" ? (
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        좌표 확인 중...
                      </p>
                    ) : null}
                    {stationStatusByName[item] === "no-match" ? (
                      <p className="mt-1 text-xs font-semibold text-rose-600">
                        매칭 실패. 다른 키워드로 검색해 주세요.
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-0 min-h-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <MapView points={stationPoints} height={240} />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
