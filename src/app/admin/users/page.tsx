"use client";

import { useEffect, useMemo, useState } from "react";

import {
  defaultUsers,
  readStoredUsers,
  writeStoredUsers,
  type AdminUser,
} from "../../_data/usersStorage";

type UserRole = AdminUser["role"];
type UserStatus = AdminUser["status"];

const roleOptions: UserRole[] = ["관리자", "일반"];
const statusOptions: UserStatus[] = ["승인대기", "활성", "정지", "거절"];
const SUPER_ADMIN_USER_ID = "riverai";
const AUTH_STORAGE_KEY = "demo-auth";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(defaultUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [hoveredSuggestionIndex, setHoveredSuggestionIndex] = useState(-1);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    id: string;
    nextRole: UserRole;
  } | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string;
    nextStatus: UserStatus;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleRoleChange = (id: string, role: UserRole) => {
    setPendingChange({ id, nextRole: role });
  };

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      setIsSuperAdmin(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { userId?: string };
      setIsSuperAdmin(
        (parsed.userId ?? "").toLowerCase() === SUPER_ADMIN_USER_ID,
      );
    } catch {
      setIsSuperAdmin(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
    setHoveredSuggestionIndex(-1);
    setIsSuggestionOpen(Boolean(debouncedSearchTerm.trim()));
  }, [debouncedSearchTerm]);

  useEffect(() => {
    // TODO: replace with API call when available.
    const storedUsers = readStoredUsers();
    if (storedUsers.length > 0) {
      setUsers(storedUsers);
    } else {
      writeStoredUsers(defaultUsers);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    writeStoredUsers(users);
  }, [isLoaded, users]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => {
      setNotice("");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredUsers = useMemo(() => {
    const normalized = submittedSearchTerm.trim().toLowerCase();
    const list = users.filter((user) => {
      if (!normalized) {
        return true;
      }
      return (
        user.userId.toLowerCase().includes(normalized) ||
        user.name.toLowerCase().includes(normalized)
      );
    });
    const superIndex = list.findIndex(
      (user) => user.userId.toLowerCase() === SUPER_ADMIN_USER_ID,
    );
    if (superIndex < 0) {
      return list;
    }
    const superUser = list[superIndex];
    return [
      superUser,
      ...list.filter((user) => user !== superUser),
    ];
  }, [submittedSearchTerm, users]);

  const suggestedUsers = useMemo(() => {
    const normalized = debouncedSearchTerm.trim().toLowerCase();
    if (!normalized) {
      return [];
    }
    return users
      .filter(
        (user) =>
          user.userId.toLowerCase().includes(normalized) ||
          user.name.toLowerCase().includes(normalized),
      )
      .slice(0, 5);
  }, [debouncedSearchTerm, users]);

  const pendingUser = useMemo(() => {
    if (!pendingChange) {
      return null;
    }
    return users.find((user) => user.id === pendingChange.id) ?? null;
  }, [pendingChange, users]);

  const pendingStatusUser = useMemo(() => {
    if (!pendingStatusChange) {
      return null;
    }
    return (
      users.find((user) => user.id === pendingStatusChange.id) ??
      null
    );
  }, [pendingStatusChange, users]);

  const confirmChange = () => {
    if (!pendingChange || !pendingUser) {
      setPendingChange(null);
      return;
    }
    const toRole = pendingChange.nextRole;
    setUsers((prev) =>
      prev.map((user) =>
        user.id === pendingChange.id ? { ...user, role: toRole } : user,
      ),
    );
    setPendingChange(null);
    setNotice(`권한이 ${toRole}(으)로 변경되었습니다.`);
  };

  const handleStatusChange = (id: string, status: UserStatus) => {
    if (!isSuperAdmin) {
      return;
    }
    setPendingStatusChange({ id, nextStatus: status });
  };

  const confirmStatusChange = () => {
    if (!pendingStatusChange || !pendingStatusUser) {
      setPendingStatusChange(null);
      return;
    }
    const { id, nextStatus } = pendingStatusChange;
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? { ...user, status: nextStatus }
          : user,
      ),
    );
    setPendingStatusChange(null);
    setNotice(`상태가 ${nextStatus}(으)로 변경되었습니다.`);
  };

  return (
    <main className="flex flex-col gap-6">
      {notice ? (
        <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-lg">
          {notice}
        </div>
      ) : null}
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          사용자 관리
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          사용자 권한 및 계정 상태를 관리하세요.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          className="flex flex-wrap items-center justify-between gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedSearchTerm(searchTerm);
            setIsSuggestionOpen(false);
          }}
        >
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="아이디/이름 검색"
              value={searchTerm}
              onChange={(event) => {
                const value = event.target.value;
                setSearchTerm(value);
                if (!value.trim()) {
                  setSubmittedSearchTerm("");
                }
                setIsSuggestionOpen(Boolean(value.trim()));
              }}
              onKeyDown={(event) => {
                if (suggestedUsers.length === 0) {
                  return;
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveSuggestionIndex((prev) =>
                    prev < suggestedUsers.length - 1 ? prev + 1 : 0,
                  );
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveSuggestionIndex((prev) =>
                    prev > 0 ? prev - 1 : suggestedUsers.length - 1,
                  );
                  return;
                }
                if (event.key === "Enter") {
                  if (activeSuggestionIndex >= 0) {
                    event.preventDefault();
                    const selected = suggestedUsers[activeSuggestionIndex];
                    if (selected) {
                      const next = selected.userId ?? selected.name;
                      setSearchTerm(next);
                      setSubmittedSearchTerm(next);
                      setActiveSuggestionIndex(-1);
                      setIsSuggestionOpen(false);
                    }
                  }
                }
                if (event.key === "Escape") {
                  setActiveSuggestionIndex(-1);
                  setIsSuggestionOpen(false);
                }
              }}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
            />
            {isSuggestionOpen ? (
              <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {suggestedUsers.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400">
                    추천 검색어가 없습니다.
                  </div>
                ) : (
                  <ul className="max-h-56 overflow-auto py-1 text-sm text-slate-700">
                    {suggestedUsers.map((user, index) => (
                      <li key={`suggest-${user.id}`}>
                        <button
                          type="button"
                          onClick={() => {
                            const next = user.userId ?? user.name;
                            setSearchTerm(next);
                            setSubmittedSearchTerm(next);
                            setActiveSuggestionIndex(-1);
                            setIsSuggestionOpen(false);
                          }}
                          onMouseEnter={() =>
                            setHoveredSuggestionIndex(index)
                          }
                          onMouseLeave={() =>
                            setHoveredSuggestionIndex(-1)
                          }
                          className={
                            activeSuggestionIndex === index ||
                            hoveredSuggestionIndex === index
                              ? "flex w-full items-center justify-between gap-2 bg-slate-50 px-3 py-2 text-left"
                              : "flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50"
                          }
                        >
                          <span className="font-medium text-slate-900">
                            {user.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {user.userId}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
          <button
            type="submit"
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            검색
          </button>
        </form>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[220px_minmax(0,1fr)_140px_120px] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span>아이디</span>
            <span>이름</span>
            <span>권한</span>
            <span>상태</span>
          </div>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[220px_minmax(0,1fr)_140px_120px] items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm text-slate-700 last:border-b-0"
            >
              <span className="truncate font-medium text-slate-900">
                {user.userId}
              </span>
              <span className="truncate text-slate-500">{user.name}</span>
              <span>
                {user.userId.toLowerCase() === SUPER_ADMIN_USER_ID ? (
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    슈퍼관리자
                  </span>
                ) : (
                  <select
                    value={user.role}
                    onChange={(event) =>
                      handleRoleChange(
                        user.id,
                        event.currentTarget.value as UserRole,
                      )
                    }
                    disabled={!isSuperAdmin}
                    className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                )}
              </span>
              <span>
                {user.userId.toLowerCase() === SUPER_ADMIN_USER_ID ? (
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {user.status}
                  </span>
                ) : (
                  <select
                    value={user.status}
                    onChange={(event) =>
                      handleStatusChange(
                        user.id,
                        event.currentTarget.value as UserStatus,
                      )
                    }
                    disabled={!isSuperAdmin}
                    className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                )}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          슈퍼관리자만 권한을 변경할 수 있습니다.
        </p>
      </section>

      {pendingChange && pendingUser ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              권한 변경 확인
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              {pendingUser.name} ({pendingUser.userId})의 권한을
              <span className="font-semibold text-slate-900">
                {" "}
                {pendingUser.role}
              </span>
              에서
              <span className="font-semibold text-slate-900">
                {" "}
                {pendingChange.nextRole}
              </span>
              (으)로 변경할까요?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                onClick={() => setPendingChange(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                onClick={confirmChange}
              >
                변경하기
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {pendingStatusChange && pendingStatusUser ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              상태 변경 확인
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              {pendingStatusUser.name} ({pendingStatusUser.userId})의
              상태를
              <span className="font-semibold text-slate-900">
                {" "}{pendingStatusUser.status}
              </span>
              에서
              <span className="font-semibold text-slate-900">
                {" "}{pendingStatusChange.nextStatus}
              </span>
              (으)로 변경할까요?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                onClick={() => setPendingStatusChange(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                onClick={confirmStatusChange}
              >
                변경하기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
