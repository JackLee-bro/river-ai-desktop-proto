"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const adminEmail = "riverai@naver.com";

  useEffect(() => {
    const stored = localStorage.getItem("demo-auth");
    if (!stored) {
      setIsLoggedIn(false);
      setIsAdmin(false);
      return;
    }
    setIsLoggedIn(true);
    try {
      const parsed = JSON.parse(stored) as { email?: string };
      setIsAdmin((parsed.email ?? "").toLowerCase() === adminEmail);
    } catch {
      setIsAdmin(false);
    }
  }, [pathname]);

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
            <Link href="/profile" className="text-white">
              내정보/로그아웃
            </Link>
          ) : (
            <Link href="/auth" className="text-white">
              로그인/회원가입
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
