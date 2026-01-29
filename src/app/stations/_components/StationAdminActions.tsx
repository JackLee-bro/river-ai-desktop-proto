"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { defaultUsers, readStoredUsers } from "../../_data/usersStorage";

type StationAdminActionsProps = {
  codeNumber: string;
  stationName?: string | null;
};

const ADMIN_USER_ID = "riverai";

export default function StationAdminActions({
  codeNumber,
  stationName,
}: StationAdminActionsProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("demo-auth");
      const parsed = stored
        ? (JSON.parse(stored) as { userId?: string; role?: string })
        : null;
      const userId = (parsed?.userId ?? "").toLowerCase();
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      if (userId === ADMIN_USER_ID) {
        setIsAdmin(true);
        return;
      }
      const storedUsers = readStoredUsers();
      const baseUsers = storedUsers.length > 0 ? storedUsers : defaultUsers;
      const matched = baseUsers.find(
        (user) => user.userId.toLowerCase() === userId,
      );
      const role = matched?.role ?? parsed?.role ?? "";
      setIsAdmin(role === "관리자");
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const normalizedCodeNumber = useMemo(
    () => String(codeNumber ?? "").trim(),
    [codeNumber],
  );

  if (!isAdmin || !normalizedCodeNumber) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Link
        href={`/admin/stations/${normalizedCodeNumber}/edit`}
        className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
      >
        수정
      </Link>
      <button
        type="button"
        onClick={() => {
          const name = stationName ? ` (${stationName})` : "";
          alert(`삭제 기능은 준비 중입니다.${name}`);
        }}
        className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
      >
        삭제
      </button>
    </div>
  );
}
