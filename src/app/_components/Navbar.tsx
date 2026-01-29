"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { defaultUsers, readStoredUsers } from "../_data/usersStorage";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const superAdminUserId = "riverai";

  useEffect(() => {
    const stored = localStorage.getItem("demo-auth");
    if (!stored) {
      setIsLoggedIn(false);
      setIsAdmin(false);
      return;
    }
    setIsLoggedIn(true);
    try {
      const parsed = JSON.parse(stored) as {
        userId?: string;
        role?: string;
      };
      const userId = (parsed.userId ?? "").toLowerCase();
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      if (userId === superAdminUserId) {
        setIsAdmin(true);
        return;
      }
      const storedUsers = readStoredUsers();
      const baseUsers =
        storedUsers.length > 0 ? storedUsers : defaultUsers;
      const matched = baseUsers.find(
        (user) => user.userId.toLowerCase() === userId,
      );
      const role = matched?.role ?? parsed.role ?? "";
      setIsAdmin(role === "관리자");
    } catch {
      setIsAdmin(false);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/members/logout", { method: "POST" });
    } catch {
      // Ignore API logout errors for demo session cleanup.
    }
    localStorage.removeItem("demo-auth");
    setIsLoggedIn(false);
    setIsAdmin(false);
    router.push("/");
  };

  return (
    <header className="border-b border-blue-700 bg-blue-600">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-white"
        >
          위치로드시스템
        </Link>
        <nav className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          <Link href="/" className="text-white">
            홈
          </Link>
          <Link href="/navigation" className="text-white">
            네비게이션
          </Link>
          <Link href="/journal" className="text-white">
            일지
          </Link>
          {isAdmin ? (
            <Link href="/admin" className="text-white">
              관리자
            </Link>
          ) : null}
          {isLoggedIn ? (
            <>
              <Link href="/profile" className="text-white">
                내정보
              </Link>
              <button type="button" onClick={handleLogout} className="text-white">
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login" className="text-white">
              로그인/회원가입
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
