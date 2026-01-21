"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminGateProps = {
  children: React.ReactNode;
};

const ADMIN_EMAIL = "riverai@naver.com";

export default function AdminGate({ children }: AdminGateProps) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("demo-auth");
      const parsed = stored ? (JSON.parse(stored) as { email?: string }) : null;
      const email = parsed?.email?.toLowerCase() ?? "";
      if (email === ADMIN_EMAIL) {
        setIsAllowed(true);
      } else {
        setIsAllowed(false);
        sessionStorage.setItem(
          "admin-auth-error",
          "관리자 권한이 필요합니다. 관리자 계정으로 로그인해주세요.",
        );
        router.replace("/auth");
      }
    } catch {
      setIsAllowed(false);
      sessionStorage.setItem(
        "admin-auth-error",
        "세션이 만료되었습니다. 다시 로그인해주세요.",
      );
      router.replace("/auth");
    } finally {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">관리자 인증 확인 중...</p>
      </div>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}
