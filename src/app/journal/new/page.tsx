"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import MapView, { type MapPoint } from "../../_components/MapView";
import { journalEntries, type JournalEntry } from "../../_data/journals";
import { stations } from "../../_data/stations";

const defaultLocations = ["해운대 관측소", "수영 관측소", "강서 관측소"];

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
  const [selectedStations, setSelectedStations] = useState<string[]>(
    defaultLocations,
  );
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
    const newEntry: JournalEntry = {
      id: newEntryId,
      title: title.trim(),
      author: "관리자",
      date,
      summary,
      body: bodyLines.length ? bodyLines : [content.trim()],
      stations: selectedStations,
      photos: [...existingPhotos, ...photoEntries],
    };
    try {
      const stored = localStorage.getItem("journalEntries");
      const parsed = stored ? (JSON.parse(stored) as JournalEntry[]) : [];
      const nextEntries = shouldUpdateStored
        ? parsed.map((entry) => (entry.id === newEntryId ? newEntry : entry))
        : [newEntry, ...parsed];
      localStorage.setItem("journalEntries", JSON.stringify(nextEntries));
    } catch {
      // Ignore storage errors and proceed with navigation.
    }
    setShowSaved(true);
    router.push("/journal");
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

  const handleAddStation = () => {
    const keyword = stationQuery.trim();
    if (!keyword) {
      return;
    }
    if (selectedStations.length >= 6) {
      alert("관측소는 최대 6개까지 추가할 수 있습니다.");
      return;
    }
    const matched = stations.find((station) =>
      station.name.includes(keyword),
    );
    if (!matched) {
      alert("관측소를 찾을 수 없습니다.");
      return;
    }
    if (selectedStations.includes(matched.name)) {
      alert("이미 추가된 관측소입니다.");
      return;
    }
    setSelectedStations((prev) => [...prev, matched.name]);
    setStationQuery("");
  };

  const handleRemoveStation = (name: string) => {
    setSelectedStations((prev) => prev.filter((item) => item !== name));
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
      const stored = localStorage.getItem("journalEntries");
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
    setSelectedStations(entry.stations ?? defaultLocations);
    setExistingPhotos(entry.photos ?? []);
    setFiles([]);
    setShowSaved(false);
  }, [searchParams]);

  const stationPoints: MapPoint[] = useMemo(
    () =>
      selectedStations
        .map((name) => {
          const matched = stations.find((station) => station.name === name);
          if (!matched) {
            return null;
          }
          return {
            id: matched.id,
            label: matched.name,
            position: matched.coords,
            kind: "station",
          } satisfies MapPoint;
        })
        .filter((value): value is MapPoint => value !== null),
    [selectedStations],
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
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                <span className="text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="관측소 검색(최대 6개)"
                  value={stationQuery}
                  onChange={(event) => setStationQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddStation();
                    }
                  }}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddStation}
                  className="whitespace-nowrap rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {selectedStations.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStation(item)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <MapView points={stationPoints} height={240} />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
