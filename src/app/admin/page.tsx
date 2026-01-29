"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  defaultUsers,
  readStoredUsers,
} from "../_data/usersStorage";

const quickLinks = [
  {
    title: "관측소 관리",
    description: "관측소 정보 및 사진 관리",
    href: "/admin/stations",
  },
  {
    title: "사용자 관리",
    description: "권한/계정 상태 관리",
    href: "/admin/users",
  },
];

export default function AdminDashboardPage() {
  const [stationCount, setStationCount] = useState(0);
  const [userCount, setUserCount] = useState(defaultUsers.length);

  const refreshCounts = async () => {
    try {
      const response = await fetch("/api/stations?page=1&size=1");
      if (response.ok) {
        const data = (await response.json()) as {
          total?: number;
          stations?: unknown[];
        };
        const list = Array.isArray(data.stations) ? data.stations : [];
        setStationCount(data.total ?? list.length);
      }
    } catch {
      // Ignore station count errors.
    }
    const storedUsers = readStoredUsers();
    setUserCount(
      storedUsers.length > 0 ? storedUsers.length : defaultUsers.length,
    );
  };

  useEffect(() => {
    void refreshCounts();
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === "demo-users"
      ) {
        void refreshCounts();
      }
    };
    const handleUsersUpdated = () => void refreshCounts();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("users-updated", handleUsersUpdated);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("users-updated", handleUsersUpdated);
    };
  }, []);

  return (
    <main className="flex flex-col gap-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          대시보드
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          운영 현황을 빠르게 확인할 수 있는 관리자 홈입니다.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {link.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{link.description}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          현황
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "관측소 개수", value: String(stationCount) },
            { label: "사용자 수", value: String(userCount) },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
