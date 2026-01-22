import type { Station } from "./stations";

const STORAGE_KEY = "demo-stations";
const DELETED_KEY = "demo-stations-deleted";
const STATIONS_UPDATED_EVENT = "stations-updated";

export const readStoredStations = (): Station[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as Station[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readDeletedIds = (): string[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = localStorage.getItem(DELETED_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDeletedIds = (ids: string[]): void => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
};

export const writeStoredStations = (stations: Station[]): void => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stations));
  window.dispatchEvent(new Event(STATIONS_UPDATED_EVENT));
};

export const saveStoredStation = (station: Station): void => {
  const stored = readStoredStations();
  const existingIndex = stored.findIndex(
    (item) => item.id === station.id,
  );
  const next = [...stored];
  if (existingIndex >= 0) {
    next[existingIndex] = station;
  } else {
    next.unshift(station);
  }
  writeStoredStations(next);
};

export const removeStoredStation = (id: string): void => {
  const stored = readStoredStations();
  const nextStored = stored.filter((item) => item.id !== id);
  writeStoredStations(nextStored);
  const deleted = readDeletedIds();
  if (!deleted.includes(id)) {
    writeDeletedIds([id, ...deleted]);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STATIONS_UPDATED_EVENT));
  }
};

export const mergeStations = (
  baseStations: Station[],
  storedStations: Station[],
): Station[] => {
  const deletedIds = new Set(readDeletedIds());
  const byId = new Map<string, Station>();
  baseStations.forEach((station) => {
    if (!deletedIds.has(station.id)) {
      byId.set(station.id, station);
    }
  });
  storedStations.forEach((station) => {
    if (!deletedIds.has(station.id)) {
      byId.set(station.id, station);
    }
  });
  return Array.from(byId.values());
};
