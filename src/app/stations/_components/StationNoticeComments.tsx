"use client";

import { useEffect, useMemo, useState } from "react";

import { defaultUsers, readStoredUsers } from "../../_data/usersStorage";

type NoticeItem = {
  id: string;
  authorId?: string;
  author: string;
  content: string;
  createdAt: string;
};

type StationNoticeCommentsProps = {
  stationCode: string;
  stationName?: string | null;
};

const ADMIN_USER_ID = "riverai";
const STORAGE_PREFIX = "station-notices:";
const CLEAR_FLAG_KEY = "station-notices-cleared-v1";

const getStorageKey = (stationCode: string) =>
  `${STORAGE_PREFIX}${stationCode}`;

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours24 = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}. ${month}. ${day}. ${hours24}:${minutes}`;
};

const loadNotices = (stationCode: string): NoticeItem[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(getStorageKey(stationCode));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as NoticeItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveNotices = (stationCode: string, notices: NoticeItem[]) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(getStorageKey(stationCode), JSON.stringify(notices));
};

const clearAllStoredNotices = () => {
  if (typeof window === "undefined") {
    return;
  }
  if (localStorage.getItem(CLEAR_FLAG_KEY)) {
    return;
  }
  const keysToRemove: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(CLEAR_FLAG_KEY, "true");
};

const resolveCurrentUser = () => {
  try {
    const stored = localStorage.getItem("demo-auth");
    const parsed = stored
      ? (JSON.parse(stored) as { userId?: string; role?: string })
      : null;
    const userId = (parsed?.userId ?? "").toLowerCase();
    const storedUsers = readStoredUsers();
    const baseUsers = storedUsers.length > 0 ? storedUsers : defaultUsers;
    const matched = baseUsers.find(
      (user) => user.userId.toLowerCase() === userId,
    );
    return {
      userId,
      name: matched?.name ?? parsed?.userId ?? "관리자",
      role: matched?.role ?? parsed?.role ?? "",
    };
  } catch {
    return { userId: "", name: "관리자", role: "" };
  }
};

export default function StationNoticeComments({
  stationCode,
  stationName,
}: StationNoticeCommentsProps) {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [currentUserName, setCurrentUserName] = useState("관리자");
  const [currentUserId, setCurrentUserId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [showCreatedModal, setShowCreatedModal] = useState(false);

  useEffect(() => {
    clearAllStoredNotices();
    if (!stationCode) return;
    setNotices(loadNotices(stationCode));
  }, [stationCode]);

  useEffect(() => {
    const user = resolveCurrentUser();
    if (!user.userId) {
      setIsAdmin(false);
      setCurrentUserName("관리자");
      setCurrentUserId("");
      return;
    }
    if (user.userId === ADMIN_USER_ID) {
      setIsAdmin(true);
      setCurrentUserName(user.name ?? "관리자");
      setCurrentUserId(user.userId);
      return;
    }
    setIsAdmin(user.role === "관리자");
    setCurrentUserName(user.name ?? "관리자");
    setCurrentUserId(user.userId);
  }, []);

  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [notices]);

  const visibleNotices = isExpanded
    ? sortedNotices
    : sortedNotices.slice(0, 5);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed || !stationCode) {
      return;
    }
    const nextNotice: NoticeItem = {
      id: `notice-${Date.now()}`,
      authorId: currentUserId,
      author: currentUserName || "관리자",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const nextNotices = [nextNotice, ...notices];
    setNotices(nextNotices);
    saveNotices(stationCode, nextNotices);
    setContent("");
    if (!isExpanded) {
      setIsExpanded(true);
    }
    setShowCreatedModal(true);
    window.setTimeout(() => setShowCreatedModal(false), 1200);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            NOTE
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {stationName ? `${stationName} 노트` : "노트"} ·{" "}
            {sortedNotices.length}개
          </p>
        </div>
      </header>

      <div className="mt-4 divide-y divide-slate-100">
        {visibleNotices.length === 0 ? (
          <p className="py-6 text-sm text-slate-400">
            작성된 노트가 없습니다.
          </p>
        ) : (
          visibleNotices.map((notice) => {
            const isOwner =
              Boolean(currentUserId) && notice.authorId === currentUserId;
            const isEditing = editingId === notice.id;
            return (
              <article key={notice.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {notice.author}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{formatDateTime(notice.createdAt)}</span>
                    {isOwner ? (
                      <div className="flex items-center gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(notice.id);
                            setEditingContent(notice.content);
                          }}
                          className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingDeleteId(notice.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="rounded-full border border-rose-200 px-2 py-0.5 font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          삭제
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                {isEditing ? (
                  <div className="mt-2">
                    <textarea
                      value={editingContent}
                      onChange={(event) => setEditingContent(event.target.value)}
                      className="h-24 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    />
                    <div className="mt-2 flex items-center justify-end gap-2 text-xs text-slate-400">
                      <span>{editingContent.length}/500</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingContent("");
                        }}
                        className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = editingContent.trim();
                          if (!trimmed || !stationCode) {
                            return;
                          }
                          const next = notices.map((item) =>
                            item.id === notice.id
                              ? { ...item, content: trimmed }
                              : item,
                          );
                          setNotices(next);
                          saveNotices(stationCode, next);
                          setEditingId(null);
                          setEditingContent("");
                        }}
                        className="rounded-full bg-blue-600 px-3 py-1 font-semibold text-white hover:bg-blue-700"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-700">
                    {notice.content}
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>

      {sortedNotices.length > 5 ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            {isExpanded ? "접기" : "+더보기"}
          </button>
        </div>
      ) : null}

      {showDeletedModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-700 shadow-lg">
            삭제되었습니다
          </div>
        </div>
      ) : null}
      {showCreatedModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-700 shadow-lg">
            등록되었습니다
          </div>
        </div>
      ) : null}

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-xs rounded-2xl bg-white px-6 py-5 text-sm shadow-lg">
            <p className="text-base font-semibold text-slate-800">
              정말 삭제할까요?
            </p>
            <p className="mt-2 text-xs text-slate-500">
              삭제하면 복구할 수 없습니다.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPendingDeleteId(null);
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!stationCode || !pendingDeleteId) return;
                  const next = notices.filter(
                    (item) => item.id !== pendingDeleteId,
                  );
                  setNotices(next);
                  saveNotices(stationCode, next);
                  if (editingId === pendingDeleteId) {
                    setEditingId(null);
                    setEditingContent("");
                  }
                  setPendingDeleteId(null);
                  setShowDeleteConfirm(false);
                  setShowDeletedModal(true);
                  window.setTimeout(
                    () => setShowDeletedModal(false),
                    1200,
                  );
                }}
                className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAdmin ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-600">
            노트 작성
          </p>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="내용을 입력하세요."
            className="mt-2 h-24 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <span className="text-xs text-slate-400">
              {content.length}/500
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              등록
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
