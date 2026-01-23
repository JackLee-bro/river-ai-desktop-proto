"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  defaultUsers,
  readStoredUsers,
  writeStoredUsers,
  type AdminUser,
} from "../_data/usersStorage";

const AUTH_STORAGE_KEY = "demo-auth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [team, setTeam] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkStatus, setCheckStatus] = useState<
    "idle" | "checking" | "available" | "duplicate"
  >("idle");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");
    setErrorMessage("");

    if (
      !email.trim() ||
      !name.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !phone.trim() ||
      !team.trim() ||
      !department.trim()
    ) {
      setStatus("error");
      setErrorMessage("필수 항목을 모두 입력해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    const storedUsers = readStoredUsers();
    const baseUsers = storedUsers.length > 0 ? storedUsers : defaultUsers;
    const alreadyExists = baseUsers.some(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (alreadyExists) {
      setStatus("error");
      setErrorMessage("이미 가입된 이메일입니다.");
      return;
    }

    const newUser: AdminUser = {
      id: `user-${Date.now()}`,
      email: email.trim(),
      name: name.trim(),
      phone: phone.trim(),
      team: team.trim(),
      department: department.trim(),
      password,
      role: "일반",
      status: "활성",
    };
    writeStoredUsers([newUser, ...baseUsers]);
    // TODO: replace with API auth session when available.
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        email: newUser.email,
        role: newUser.role,
        loggedInAt: new Date().toISOString(),
      }),
    );
    setStatus("success");
    router.push("/");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl bg-slate-200/80 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">회원가입</h1>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                아이디(이메일) <span className="text-rose-500">*</span>
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = email.trim().toLowerCase();
                    if (!trimmed) {
                      setCheckStatus("idle");
                      setStatus("error");
                      setErrorMessage("이메일을 입력해주세요.");
                      return;
                    }
                    setErrorMessage("");
                    setStatus("idle");
                    setCheckStatus("checking");
                    const storedUsers = readStoredUsers();
                    const baseUsers =
                      storedUsers.length > 0
                        ? storedUsers
                        : defaultUsers;
                    const exists = baseUsers.some(
                      (user) =>
                        user.email.toLowerCase() === trimmed,
                    );
                    setCheckStatus(
                      exists ? "duplicate" : "available",
                    );
                  }}
                  className="whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  중복확인
                </button>
              </div>
              {checkStatus === "available" && (
                <p className="mt-2 text-xs font-semibold text-emerald-600">
                  사용 가능한 이메일입니다.
                </p>
              )}
              {checkStatus === "duplicate" && (
                <p className="mt-2 text-xs font-semibold text-rose-600">
                  이미 가입된 이메일입니다.
                </p>
              )}
            </div>

            <label className="block text-xs font-semibold text-slate-600">
              비밀번호 <span className="text-rose-500">*</span>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호 입력"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              비밀번호 확인 <span className="text-rose-500">*</span>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="비밀번호 확인"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              전화번호 <span className="text-rose-500">*</span>
              <input
                required
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="010-0000-0000"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              이름 <span className="text-rose-500">*</span>
              <input
                required
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="이름 입력"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-600">
                소속 <span className="text-rose-500">*</span>
                <input
                  required
                  type="text"
                  value={team}
                  onChange={(event) => setTeam(event.target.value)}
                  placeholder="소속 입력"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                부서 <span className="text-rose-500">*</span>
                <input
                  required
                  type="text"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  placeholder="부서 입력"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              회원가입
            </button>
          </form>

          {status === "success" && (
            <p className="mt-3 text-xs font-semibold text-emerald-600">
              회원가입 완료! 홈으로 이동합니다.
            </p>
          )}
          {status === "error" && (
            <p className="mt-3 text-xs font-semibold text-rose-600">
              {errorMessage}
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>이미 계정이 있나요?</span>
            <Link href="/auth" className="text-slate-600 hover:text-slate-900">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
