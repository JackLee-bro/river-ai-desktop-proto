"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { defaultUsers, readStoredUsers } from "../_data/usersStorage";

const AUTH_STORAGE_KEY = "demo-auth";

export default function AuthPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [adminNotice, setAdminNotice] = useState("");
  const router = useRouter();
  const adminUserId = "riverai";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUserId = userId.trim().toLowerCase();
    setStatus("idle");

    try {
      const response = await fetch("/api/members/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: trimmedUserId,
          password,
        }),
      });
      const data = (await response.json()) as {
        result?: boolean;
        errorMsg?: string | null;
        role?: string | null;
      };

      if (!response.ok || data.result !== true) {
        setStatus("error");
        return;
      }

      const storedUsers = readStoredUsers();
      const baseUsers =
        storedUsers.length > 0 ? storedUsers : defaultUsers;
      const matchedUser = baseUsers.find(
        (user) => user.userId.toLowerCase() === trimmedUserId,
      );
      const role =
        (data.role as string | undefined) ??
        (trimmedUserId === adminUserId ? "관리자" : matchedUser?.role) ??
        "일반";

      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          userId,
          role,
          loggedInAt: new Date().toISOString(),
        }),
      );
      setStatus("success");
      if (role === "관리자") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    const notice = sessionStorage.getItem("admin-auth-error");
    if (notice) {
      setAdminNotice(notice);
      sessionStorage.removeItem("admin-auth-error");
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl bg-slate-200/80 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">로그인</h1>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold text-slate-600">
              아이디
              <input
                type="text"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="아이디를 입력하세요"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              비밀번호
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              로그인
            </button>
          </form>

          {status === "success" && (
            <p className="mt-3 text-xs font-semibold text-emerald-600">
              로그인 성공! 데모 세션이 저장되었습니다.
            </p>
          )}
          {adminNotice && (
            <p className="mt-3 text-xs font-semibold text-amber-600">
              {adminNotice}
            </p>
          )}
          {status === "error" && (
            <p className="mt-3 text-xs font-semibold text-rose-600">
              아이디 또는 비밀번호가 올바르지 않습니다.
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500">
            <span className="cursor-not-allowed">아이디찾기</span>
            <span className="text-slate-300">|</span>
            <span className="cursor-not-allowed">암호 찾기</span>
            <span className="text-slate-300">|</span>
            <Link href="/signup?terms=1" className="text-slate-600 hover:text-slate-900">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
