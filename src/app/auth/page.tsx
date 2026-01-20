"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValid =
      email.trim().toLowerCase() === "riverai@naver.com" &&
      password === "123qwe";

    if (isValid) {
      localStorage.setItem(
        "demo-auth",
        JSON.stringify({ email, loggedInAt: new Date().toISOString() }),
      );
      setStatus("success");
      router.push("/");
      return;
    }

    setStatus("error");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl bg-slate-200/80 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">로그인</h1>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold text-slate-600">
              이메일
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="riverai@naver.com"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              비밀번호
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="123qwe"
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
          {status === "error" && (
            <p className="mt-3 text-xs font-semibold text-rose-600">
              이메일 또는 비밀번호가 올바르지 않습니다.
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500">
            <span className="cursor-not-allowed">아이디찾기</span>
            <span className="text-slate-300">|</span>
            <span className="cursor-not-allowed">암호 찾기</span>
            <span className="text-slate-300">|</span>
            <span className="cursor-not-allowed">회원가입</span>
          </div>
        </div>
      </div>
    </main>
  );
}
